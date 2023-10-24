# vite-plugin-svg-sprite

SVG sprite plugin for [Vite](https://github.com/vitejs/vite)

## install
```
npm i @olnho/vite-plugin-svg-sprite -D
```

## Usage

Add the plugin to your `vite.config.js`:

```javascript
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

import svgSprite from "@olnho/vite-plugin-svg-sprite";

// https://vitejs.dev/config/
export default defineConfig((option) => {
  return {
    plugins: [
      vue(),
      svgSprite({
        svgPaths: ["./src/assets/icons"],  
        extensions: [".svg"],  //file extension,default [".svg"]
      }),
    ],
  };
});

```

Then use it like that in your app code:

```js
import { createApp } from "vue";
import "./style.css";
import App from "./App.vue";

import "svg-icons";  // you just do it,so easy

createApp(App).mount("#app");

```

```vue 
<script setup></script>

<template>
    <svg class="icon svg-icon" aria-hidden="true">
        <use xlink:href="#icon-svg-filename"></use>
    </svg>
</template>

<style scoped>
    .icon {
        width: 1em;
        height: 1em;
    }
</style>
```

## options

```javascript
const svgSprite = svgSprite(options);
```

### `options.svgPaths: array|string`

For generating the `id` attribute of `<symbol>` element. Defaults to `[icon-filename]`,Don’t use file extension again

### `options.extensions: array|string` Defaults to `[".svg"]`,