# vue-autoblog
A compile-time tool to generate `.vue` single-file-components from markdown.

## Install

### **yarn**

```yarn add -D vue-autoblog```

### **npm**

```npm install vue-autoblog --save-dev```

## Usage

Run `npx vue-autoblog` or `./node_modules/vue-autoblog/bin/main.js` to generate `.vue` files to for your project.
A `.autoblog.json` configuration file is required in the root directory of your project for configuring the tool (see the configuration section below for example).

`vue-autoblog` reads `.md` files from your input folder and generates single-file `.vue` components.
Each `.md` file can have YAML front-matter at the top for specifying metadata and extra information for each post.

## Configuration

`vue-autoblog` reads a `.autoblog.json` file located in the root directory of your project for configuring the output of the generated files.

### Example `.autoblog.json` file
```json
{
  "markdownit": {
    "xhtmlOut": true,
    "linkify": true,
    "typographer": true
  },
  "directory": {
    "inputFolder": "src/md/",
    "outputFolder": "src/autoblog/"
  },
  "defaultStyle": "blog",
  "outputType": "vue",
  "typescript": true,
  "vue": {
    "outputMeta": true
  }
}
```

#### `markdownit` **(markdown-it config options)**

`vue-autoblog` uses [`markdown-it`](https://github.com/markdown-it/markdown-it) to parse markdown into HTML. Specify [markdown-it config options](https://github.com/markdown-it/markdown-it#init-with-presets-and-options) in the configuration JSON to configure the markdown parser.

#### `directory` **(input and output folder strings)**

* `inputFolder`: the folder to read `.md` files from

* `outputFolder`: the folder to output rendered `.vue` files to

NOTE: To avoid conflicts during `.vue` file generation, try to set `directory.outputFolder` to be different from `directory.inputFolder`.

#### `defaultStyle` **(string)**

#### `outputType` **(string)**

Specify the type of file to generate and output. Defaults to `"vue"`, but can be set to `"html"` if one wishes to simply generate `.html` files in the output folder.

#### `typescript` **(boolean)**

If you are using typescript, setting this value to true will generate `.d.ts` typings for the generated routes and posts files.

#### `vue` **(vue specific settings)**

* `outputMeta` **(boolean)**:

  Set this to true if you are using [`vue-meta`](https://github.com/declandewet/vue-meta) to output `metaInfo` values into the script portion of the generated `.vue` files.
