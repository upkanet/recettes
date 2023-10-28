import express from 'express'
import fs from 'fs'
import {default as showdown}  from 'showdown'
const app = express()
const port = 3000

app.use(express.static('public'))

app.get('/', (req, res) => {
  res.send(templatePage("Recettes","<h1>Recettes</h1>",'.'))
})

app.get('/recipe/:category/:recipeName', (req, res) => {
    const category = req.params.category
    const recipeName = req.params.recipeName
    
    try{
        let fileContent = fs.readFileSync(`${category}/${recipeName}.md`,'utf-8')
        fileContent = fileContent.replaceAll('\n','<br>')
        fileContent = fileContent.replaceAll('<br>***<br>','\n***\n')
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
        <script src="https://cdnjs.cloudflare.com/ajax/libs/showdown/2.1.0/showdown.min.js"></script>
        <link rel="stylesheet" href="${pathToRoot}/mdviewer.css">
    </head>
    <body>
        <div id="navbar">
            <ul>
                <li>Plats
                    <ul>
                        <li><a href="recipe/plats/Rumsteak BBQ">🥩 Rumsteak BBQ</a></li>
                        <li data-recipe="plats/Pizza Margerita">🍕 Pizza Margerita</li>
                    </ul>
                </li>
            </ul>
        </div>
        <main>
            ${content}
        </main>
    </body>
    </html>
    `
}