const unicodeRegExp =
  /a-zA-Z\u00B7\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u037D\u037F-\u1FFF\u200C-\u200D\u203F-\u2040\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD/;

const attribute =
  /^\s*([^\s"'<>\/=]+)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/;
const dynamicArgAttribute =
  /^\s*((?:v-[\w-]+:|@|:|#)\[[^=]+?\][^\s"'<>\/=]*)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/;
const ncname = `[a-zA-Z_][\\-\\.0-9_a-zA-Z${unicodeRegExp.source}]*`;
const qnameCapture = `((?:${ncname}\\:)?${ncname})`;
const startTagOpen = new RegExp(`^<${qnameCapture}`);
const startTagClose = /^\s*(\/?)>/;
const endTag = new RegExp(`^<\\/${qnameCapture}[^>]*>`);
const doctype = /^<!DOCTYPE [^>]+>/i;
// #7298: escape - to avoid being passed as HTML comment when inlined in page
const comment = /^<!\--/;
const conditionalComment = /^<!\[/;
const defaultTagRE = /\{\{((?:.|\r?\n)+?)\}\}/g;

const ELEMENT_TYPE = 1;
const TEXT_TYPE = 3;

export const parseHTML = (html) => {
  let index = 0;
  function advance(step) {
    index += step;
    html = html.substring(step);
  }

  let stack = [];
  let root = null;
  let currParent;

  function createASTNode(tag, attrs) {
    return {
      tag,
      attrs,
      type: ELEMENT_TYPE,
      parent: null,
      children: [],
    };
  }

  function start(tag, attrs) {
    const node = createASTNode(tag, attrs);
    if (!root) {
      root = node;
      currParent = node;
    } else {
      node.parent = currParent;
      currParent.children.push(node);
      currParent = node;
    }
    stack.push(node);
  }

  function chars(text) {
    text = text.replace(/\s/g, "");
    text &&
      currParent.children.push({
        type: TEXT_TYPE,
        text,
        parent: currParent,
      });
  }

  function end(tag) {
    stack.pop();
    currParent = stack[stack.length - 1];
  }

  function parseStartTag() {
    const startT = html.match(startTagOpen);
    if (startT) {
      const match = {
        tagName: startT[1],
        attrs: [],
        start: 0,
        end: 0,
      };
      advance(startT[0].length);
      let attr, end;
      while (
        !(end = html.match(startTagClose)) &&
        (attr = html.match(dynamicArgAttribute) || html.match(attribute))
      ) {
        // console.log(end, attr);
        attr.start = index;
        advance(attr[0].length);
        attr.end = index;
        match.attrs.push(attr);
      }
      if (end) {
        match.unarySlash = end[1];
        advance(end[0].length);
        match.end = index;
        // console.log(match);
        return match;
      }
    }
  }
  while (html) {
    let textEnd = html.indexOf("<");
    // 标签
    if (textEnd === 0) {
      // 结束标签
      const endTagMatch = html.match(endTag);
      if (endTagMatch) {
        advance(endTagMatch[0].length);
        end(endTagMatch[0]);
      }

      // 开始标签
      const startTagMatch = parseStartTag();
      if (startTagMatch) {
        start(startTagMatch.tagName, startTagMatch.attrs);
      }
    }

    // 文本
    if (textEnd > 0) {
      const text = html.substring(0, textEnd);
      advance(text.length);
      chars(text);
    }
  }

  return root;
};

export default function compileToFunction(template) {
  console.log(template);

  const ast = parseHTML(template);
  console.log(ast);
  const code = codegen(ast);
  console.log(code);
  const render = `with(this){return ${code}}`;
  // console.log(render);
  return new Function(render);
}

function genProp(attrs) {
  let res = "";
  attrs.forEach(function (item) {
    if (item[1] === "style") {
      const styleStr = item[3];
      // console.log(styleStr);
      let s = "";
      const pairs = styleStr.split(";");
      for (let i = 0; i < pairs.length - 1; i++) {
        const kv = pairs[i].split(":");
        s += `${JSON.stringify(kv[0].trim())}:${JSON.stringify(kv[1].trim())},`;
      }
      res += `"style":{${s.slice(0, -1)}},`;
    } else {
      res += `"${item[1].trim()}":"${item[3].trim()}",`;
    }
  });
  res = res.slice(0, -1);
  return `{${res}}`;
}

function gen(child) {
  if (child.type === ELEMENT_TYPE) {
    return codegen(child);
  } else if (child.type === TEXT_TYPE) {
    const text = child.text;
    if (defaultTagRE.test(text)) {
      let tokens = [];
      let match;
      let index = 0;
      let lastIndex = (defaultTagRE.lastIndex = 0);
      while ((match = defaultTagRE.exec(text))) {
        index = match.index;
        if (index > lastIndex) {
          tokens.push(JSON.stringify(text.slice(lastIndex, index)));
        }
        tokens.push(`_s(${match[1]})`);
        lastIndex = index + match[0].length;
      }
      if (lastIndex < text.length) {
        tokens.push(JSON.stringify(text.slice(lastIndex)));
      }
      return `_v(${tokens.join("+")})`;
    } else {
      return `_v(${JSON.stringify(text)})`;
    }
  }
}

function genChildren(children) {
  return children.map((child) => gen(child)).join(",");
}

// _c('div', {'id': 'a', 'x': 1}, _c('div', {style: {"color": ""}, _v(_s(name) + "hello")}));
function codegen(ast, res = "") {
  if (ast.type === ELEMENT_TYPE) {
    res += `_c(${JSON.stringify(ast.tag)}${
      ast.attrs.length > 0 ? `,${genProp(ast.attrs)}` : ",null"
    }${ast.children.length > 0 ? `,${genChildren(ast.children)}` : ""})`;
  }

  if (ast.type === TEXT_TYPE) {
    res += `_v(${JSON.stringify(ast.text)})`;
  }

  if (ast.children && ast.children.length) {
    // codegen(ast);
  }

  return res;
}
