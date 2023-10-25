import path from 'path'
import { readFileSync, readdirSync, utimesSync, existsSync, statSync } from 'fs'
import chokidar from '@danielkalen/chokidar'

let svgPaths = []
let extensions = []

function getSvgFile(svgPaths) {
    svgPaths = typeof svgPaths == 'string' ? svgPaths.split(',') : svgPaths

    let files = []
    svgPaths.forEach((dir) => {
        existsSync(dir) &&
            readdirSync(dir, { withFileTypes: true }).forEach((file) => {
                if (file.isDirectory()) {
                    files.push(...getSvgFile(path.resolve(dir, file.name)))
                } else if (extensions.includes(path.extname(file.name))) {
                    const svg = readFileSync(path.resolve(dir, file.name))
                        .toString()
                        .replace(/(\r)|(\n)/g, '')

                    let matches = svg.match(/<svg([^>+].*?)>(.*?)<\/svg>/)
                    if (matches && matches.length == 3) {
                        let attribute = matches[1]
                        let content = matches[2]

                        let width = 0
                        let height = 0
                        attribute = matches[1].replace(/(width|height|xmlns|xmlns:xlink|class|aria-hidden)="([^>+].*?)"/g, (s1, s2, s3) => {
                            if (s2 === 'width') {
                                width = s3
                            } else if (s2 === 'height') {
                                height = s3
                            }
                            return ''
                        })

                        if (!/(viewBox="[^>+].*?")/g.test(attribute)) {
                            attribute += `viewBox="0 0 ${width} ${height}"`
                        }

                        let { name } = path.parse(file.name)
                        files.push(`<symbol id="icon-${name}" ${attribute}>${content}</symbol>`)
                    }
                }
            })
    })

    return files
}

//By listening for changes to the SVG storage folder, such as adding or deleting SVG files,
//modify the access time of the file where `import 'svg-icons'` is located to enable vite to HRM.
let watcherObj = {}
let importSvgIconsFile = ''
function watchSvgPath() {
    svgPaths.forEach((dir) => {
        dir = path.resolve(dir)
        try {
            statSync(dir)
            watcherObj[dir] = chokidar
                .watch(dir, { ignoreInitial: true })
                .on('all', (event, file) => {
                    viteHRM(file)
                })
                .on('error', (error, file) => {
                    utimesSync(importSvgIconsFile, new Date(), new Date())
                })
        } catch (error) {
            watchExistParentDir(dir)
        }
    })
}

function getExistParentDir(dir) {
    dir = path.dirname(dir)
    try {
        let stats = statSync(dir)
        if (!stats || !stats.isDirectory()) {
            return getExistParentDir(dir)
        }
        return dir
    } catch (err) {
        return getExistParentDir(dir)
    }
}

//Determine if Vite hot-reloading is needed.
function viteHRM(file) {
    svgPaths.forEach((svgPath) => {
        svgPath = path.resolve(svgPath)
        if (file.startsWith(svgPath) || svgPath.startsWith(file)) {
            utimesSync(importSvgIconsFile, new Date(), new Date())
        }
    })
}

function watchExistParentDir(dir) {
    dir = getExistParentDir(dir)
    watcherObj[dir] = chokidar
        .watch(dir, { ignoreInitial: true })
        .on('all', (event, file) => {
            viteHRM(file)
        })
        .on('error', (error, file) => {
            utimesSync(importSvgIconsFile, new Date(), new Date())
        })
}

export default (option = {}) => {
    option = {
        extensions: ['.svg'],
        ...option,
    }

    svgPaths = option.svgPaths || []
    svgPaths = typeof svgPaths == 'string' ? svgPaths.split(',') : svgPaths

    extensions = option.extensions || ['.svg']
    extensions = typeof extensions == 'string' ? extensions.split(',') : extensions

    return {
        name: '@olnho/vite-plugin-svg-sprite',
        enforce: 'pre',
        resolveId(id) {
            if (id == 'svg-icons') {
                return '\0svg-icons'
            }
        },
        transform(content, file) {
            if (/import\s+["|']svg-icons["|']/.test(content)) {
                importSvgIconsFile = file

                Object.entries(watcherObj).forEach(([_, watch]) => watch.close())
                watchSvgPath()

                let contents = getSvgFile(svgPaths).join('')
                let code = ''
                if (contents) {
                    code = `
          let div = document.createElement("div");
          div.innerHTML = \`<svg aria-hidden="true" style="position: absolute; width: 0px; height: 0px; overflow: hidden;">${contents}</svg>\`;
          div = div.querySelector("svg");
          document.body.insertBefore(div, document.body.firstChild);`
                }

                return content.replace(/import\s+["|']svg-icons["|'];?/, code)
            }
        },
        closeBundle() {
            Object.entries(watcherObj).forEach(([_, watch]) => watch.close())
        },
    }
}
