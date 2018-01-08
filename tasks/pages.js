const fs = require('fs');
const path = require('path');

const mkdirp = require('mkdirp');
const marked = require('marked');
const handlebars = require('handlebars');
const prism = require('prismjs');

const PAGES_PATH = 'src/pages';
const TEMPLATES_PATH = 'src/templates';

function readFile (filePath, callback) {
  const FILE_ENCODE = 'utf8';

  if (callback) {
    return fs.readFile(filePath, FILE_ENCODE, callback);
  } else {
    return fs.readFileSync(filePath, FILE_ENCODE);
  }
}

function readdirRecursiveSync(dir) {
  return fs.statSync(dir).isDirectory()
    ? Array.prototype.concat(...fs.readdirSync(dir).map(f => readdirRecursiveSync(path.join(dir, f))))
    : dir;
}

var templateRenderers = {};

var codeOptionsDefault = {
  linenum: false,
  renderer: 'code'
};

function getTemplateRenderer (name) {
  if (!templateRenderers[name]) {
    var templateContent;

    try {
      templateContent = readFile(path.join(TEMPLATES_PATH, 'renderers', '_' + name + '.hbs'));
      templateRenderers[name] = handlebars.compile(templateContent.toString());
    } catch (error) {
      if (!templateRenderers[codeOptionsDefault.renderer]) {
        templateContent = readFile(path.join(TEMPLATES_PATH, 'renderers', '_' + codeOptionsDefault.renderer + '.hbs'));
        templateRenderers[codeOptionsDefault.renderer] = handlebars.compile(templateContent.toString());
      }

      templateRenderers[name] = templateRenderers[codeOptionsDefault.renderer];
    }
  }

  return templateRenderers[name];
}

function getCodeOptions (code) {
  var firstLine = code.slice(0, code.indexOf('\n'));
  var regexpCheck = /^\[.+\]$/g
  var options;

  if (firstLine.match(regexpCheck) !== null) {
    var item, regexpGet = /\[(\w+)=?(\w+)?\]/g
    options = {};

    while (item = regexpGet.exec(firstLine)) {
      options[item[1]] = item[2] || true;
    }
  }

  return options;
}


var markedRenderer = new marked.Renderer();

marked.Renderer.prototype.code = function (code, langData, escaped) {
  var langArray, lang;

  if (langData) {
    langArray = langData.split(':');
    lang = langArray[0];
  }

  var codeOptions = getCodeOptions(code);

  if (codeOptions) {
    // Remove First Line
    code = code.substr(code.indexOf('\n') + 1);
  }

  codeOptions = Object.assign({}, codeOptionsDefault, codeOptions || {});

  var codeData = {
    class: null,
    code: null
  };

  if (this.options.highlight) {
    var out = this.options.highlight(code, lang);

    if (out != null && out !== code) {
      escaped = true;
      code = out;
    }
  }

  codeData.code = (escaped ? code : escape(code, true));

  if (lang) {
    codeData.class = this.options.langPrefix + escape(lang, true);
  }

  var template = getTemplateRenderer(codeOptions.renderer);

  return template(codeData);
};

marked.setOptions({
  renderer: markedRenderer,
  gfm: true,
  tables: true,
  breaks: false,
  langPrefix: 'language-',
  pedantic: false,
  sanitize: true,
  smartLists: true,
  smartypants: false,
  highlight: function (code, lang) {
    var htmlcode;

    if (prism.languages[lang]) {
      htmlcode = prism.highlight(code, prism.languages[lang]);
    } else {
      htmlcode = code;
    }

    return htmlcode;
  }
});

function main () {
  var fileTemplate = readFile(path.join(TEMPLATES_PATH, '_layout.hbs'));
  var template = handlebars.compile(fileTemplate.toString());

  var filelist = readdirRecursiveSync(PAGES_PATH);
  var filePage, html, outputFile, outputFilePath;

  filelist.forEach(function(filePath) {
    filePage = readFile(filePath);
    outputHTML = template({
      title: 'wou!',
      body: marked(filePage.toString())
    });

    outputFilePath = 'dist' + path.dirname(filePath).substr(PAGES_PATH.length);
    outputFile = path.join(outputFilePath, path.basename(filePath, '.md') + '.html');

    mkdirp.sync(outputFilePath);
    fs.writeFileSync(outputFile, outputHTML);
  });
}

module.exports = main;
