import express from 'express'
import fs from 'fs'
import {default as showdown}  from 'showdown'
const app = express()
const port = 3000

import listContents from 'list-contents'

app.use(express.static('public'))

app.get('/', (req, res) => {
    listContents('./recettes',{exclude: ['.obsidian']},(data)=>{
        const files = data.files
        let menu = []
        files.forEach(file => {
            const folderFile = file.split('/')
            menu[folderFile[0]] = menu[folderFile[0]] ? menu[folderFile[0]] : []
            menu[folderFile[0]].push(folderFile[1].split('.md')[0])
        })
        let html = ''
        Object.keys(menu).forEach(folder=>{
            html += `<h1>${folder}</h1>`
            menu[folder].forEach(file=>{
                html += `<a href="recettes/${folder}/${file}">${file}</a><br>`
            })
        })
        res.send(templatePage('Recettes',html,''))
    })
})

app.get('/recettes/:category/:recipeName', (req, res) => {
    const category = req.params.category
    const recipeName = req.params.recipeName
    
    try{
        let fileContent = fs.readFileSync(`recettes/${category}/${recipeName}.md`,'utf-8')
        fileContent = replaceUrlsWithLinks(fileContent)
        fileContent = fileContent.replaceAll('🔗','<img src="../../img/link.png" width="20">')
        fileContent = fileContent.replaceAll('⚖','<img src="../../img/weight.png" width="20">')
        fileContent = fileContent.replaceAll('🔧','<img src="../../img/wrench.png" width="20">')
        fileContent = fileContent.replaceAll('🔪','<img src="../../img/tools.png" width="20">')
        fileContent = fileContent.replaceAll('👥','<img src="../../img/people.png" width="20">')
        res.send(templatePage(recipeName,`<h1>${recipeName}</h1>` + convert(fileContent),'../..'))
    }
    catch(err){
        console.error(err)
        return res.send('File not found')
    }
})

app.listen(port, () => {
  console.log(`Recipes available at ${port}`)
})

function convert(mdString){
    let converter = new showdown.Converter({
        simpleLineBreaks:true
    })
    return converter.makeHtml(mdString)    
}

function templatePage(title,content,pathToRoot){
    return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        <link rel="stylesheet" href="${pathToRoot}/mdviewer.css">
    </head>
    <body>
        <main>
            ${content}
        </main>
    </body>
    </html>
    `
}

function replaceUrlsWithLinks(text) {
    const expressionWithHttp =
      /(https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*))/gi;
  
    const regex = new RegExp(expressionWithHttp);
  
    return text.replace(regex, "<a href='$1' target='_new'>$1</a>");
  }