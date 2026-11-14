import express from 'express'
import fs from 'fs'
import {default as showdown}  from 'showdown'
const app = express()
app.use(express.json());
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
            html += `<h1>${capitalizeFirstLetter(folder)}</h1>`
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
        fileContent = fileContent.replaceAll(/📏(.*)/g,'<span class="tab">$1</span>')
        fileContent = fileContent.replaceAll('📏','-')
        res.send(templatePage(recipeName,`<h1>${recipeName}</h1>` + convert(fileContent),'../..'))
    }
    catch(err){
        console.error(err)
        return res.send('File not found')
    }
})

// Route pour afficher l'éditeur
app.get('/edit/:category/:recipeName', (req, res) => {
    const category = req.params.category
    const recipeName = req.params.recipeName
    const filePath = `recettes/${category}/${recipeName}.md`

    try {
        const fileContent = fs.readFileSync(filePath, 'utf-8')
        res.send(editorTemplate(recipeName, category, fileContent, '../..'))
    } catch(err) {
        console.error(err)
        return res.status(404).send('File not found')
    }
})

// API pour sauvegarder le fichier Markdown
app.post('/api/save/:category/:recipeName', (req, res) => {
    const category = req.params.category
    const recipeName = req.params.recipeName
    const filePath = `recettes/${category}/${recipeName}.md`
    
    try {
        fs.writeFileSync(filePath, req.body.content, 'utf-8')
        res.json({ success: true })
    } catch(err) {
        console.error(err)
        res.status(500).json({ success: false, error: err.message })
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
        <link rel="stylesheet" href="${pathToRoot}/style.css">
        <link rel="icon" type="image/x-icon" href="${pathToRoot}/img/favicon.png">
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

function capitalizeFirstLetter(text){
    return text.charAt(0).toUpperCase() + text.slice(1)
}

function editorTemplate(title, category, content, pathToRoot) {
    let blocksHtml = '';
    try {
        // Lecture du fichier de configuration des boutons
        const blocks = JSON.parse(fs.readFileSync('blocks.json', 'utf-8'));
        // encodeURIComponent évite de casser le HTML si le bloc contient des guillemets
        blocksHtml = blocks.map(b => 
            `<button class="block-btn" type="button" onclick="insertText('${encodeURIComponent(b.text)}')">${b.label}</button>`
        ).join(' ');
    } catch (e) {
        console.error("Erreur de lecture de blocks.json", e);
    }

    return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Édition : ${title}</title>
        <link rel="stylesheet" href="${pathToRoot}/style.css">
        <style>
            .editor-container { max-width: 800px; margin: 0 auto; }
            .toolbar { margin-bottom: 10px; display: flex; flex-wrap: wrap; gap: 5px; }
            .block-btn { background: #f0f0f0; border: 1px solid #ccc; padding: 5px 10px; cursor: pointer; border-radius: 4px; }
            .block-btn:hover { background: #e0e0e0; }
            #editor { width: 100%; height: 60vh; font-family: monospace; padding: 10px; box-sizing: border-box; resize: vertical; }
            .save-btn { margin-top: 15px; background: #4CAF50; color: white; padding: 10px 20px; border: none; cursor: pointer; font-size: 16px; border-radius: 4px; }
            .save-btn:hover { background: #45a049; }
            .actions { display: flex; justify-content: space-between; align-items: center; }
        </style>
    </head>
    <body>
        <main class="editor-container">
            <h1>Édition : ${title}</h1>
            <div class="toolbar">
                ${blocksHtml}
            </div>
            <textarea id="editor">${content}</textarea>
            <div class="actions">
                <button class="save-btn" onclick="saveFile()">Sauvegarder</button>
                <a href="/recettes/${category}/${title}">Voir la recette</a>
            </div>
        </main>

        <script>
            // Insère le texte là où se trouve le curseur dans le textarea
            function insertText(encodedText) {
                const text = decodeURIComponent(encodedText);
                const textarea = document.getElementById('editor');
                const start = textarea.selectionStart;
                const end = textarea.selectionEnd;
                
                textarea.value = textarea.value.substring(0, start) + text + textarea.value.substring(end);
                
                // Replace le curseur juste après le texte inséré
                textarea.selectionStart = textarea.selectionEnd = start + text.length;
                textarea.focus();
            }

            // Sauvegarde le contenu via l'API
            async function saveFile() {
                const content = document.getElementById('editor').value;
                const btn = document.querySelector('.save-btn');
                btn.textContent = "Sauvegarde en cours...";
                
                try {
                    const res = await fetch('/api/save/${category}/${title}', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ content })
                    });
                    
                    if (res.ok) {
                        btn.textContent = "Sauvegardé !";
                        btn.style.background = "#2E7D32";
                        setTimeout(() => {
                            btn.textContent = "Sauvegarder";
                            btn.style.background = "#4CAF50";
                        }, 2000);
                    } else {
                        alert('Erreur côté serveur lors de la sauvegarde.');
                        btn.textContent = "Sauvegarder";
                    }
                } catch(e) {
                    alert('Erreur réseau lors de la sauvegarde.');
                    btn.textContent = "Sauvegarder";
                }
            }
        </script>
    </body>
    </html>
    `
}
