import express from 'express'
import fs from 'fs'
import path from 'path'
import {default as showdown}  from 'showdown'
const app = express()
const port = 3000

import listContents from 'list-contents'

app.use(express.static('public'))

app.get('/', (req, res) => {
    listContents('./recettes',(data)=>{
        res.send(templatePage('Recettes',data.files.map(file=>file.split('.md')[0]).map(file=>`<a href="recettes/${file}">${file}</a>`).join('<br>'),''))
    })
})

app.get('/recettes/:category/:recipeName', (req, res) => {
    const category = req.params.category
    const recipeName = req.params.recipeName
    
    try{
        let fileContent = fs.readFileSync(`recettes/${category}/${recipeName}.md`,'utf-8')
        fileContent = fileContent.replaceAll('\n','<br>')
        fileContent = fileContent.replaceAll('<br>***<br>','\n***\n')
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
    let converter = new showdown.Converter()
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