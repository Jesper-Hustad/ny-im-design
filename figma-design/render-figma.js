const fs = require('fs');
const path = require('path');
const Handlebars = require('handlebars');

// Register helpers (same as render.js)
Handlebars.registerHelper('formatDate', function (dateStr) {
    if (!dateStr) return '—';
    const [year, month, day] = dateStr.split('-');
    return `${day}.${month}.${year}`;
});

Handlebars.registerHelper('formatDateTime', function (dateTimeStr) {
    if (!dateTimeStr) return '—';
    const [datePart, timePart] = dateTimeStr.split('T');
    const [year, month, day] = datePart.split('-');
    const time = timePart ? timePart.substring(0, 5) : '';
    return `${day}.${month}.${year} kl. ${time}`;
});

Handlebars.registerHelper('periodeMedDager', function (fom, tom) {
    if (!fom || !tom) return '—';
    const start = new Date(fom);
    const end = new Date(tom);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
    const [sy, sm, sd] = fom.split('-');
    const [ey, em, ed] = tom.split('-');
    const dagText = diffDays === 1 ? 'dag' : 'dager';
    return `${sd}.${sm}.${sy} – ${ed}.${em}.${ey} (${diffDays} ${dagText})`;
});

Handlebars.registerHelper('hasItems', function (arr) {
    return Array.isArray(arr) && arr.length > 0;
});

Handlebars.registerHelper('gt', function (a, b) {
    return a > b;
});

Handlebars.registerHelper('inc', function (val) {
    return val + 1;
});

// Read template
const workDir = path.join(__dirname, '..', 'inntektsmelding_handlebars_work');
const templateSource = fs.readFileSync(path.join(workDir, 'template.hbs'), 'utf8');
const template = Handlebars.compile(templateSource);

// Process all scenario files
const scenariosDir = path.join(workDir, 'scenarios');
const files = fs.readdirSync(scenariosDir).filter(f => f.endsWith('.json')).sort();

// Encode PNG images as base64 for embedding
const pdfImagesDir = path.join(__dirname, 'joark-pdf');

const scenarios = files.map(file => {
    const data = JSON.parse(fs.readFileSync(path.join(scenariosDir, file), 'utf8'));
    const renderedHtml = template(data);
    const pngFile = file.replace('.json', '.png');
    const pngPath = path.join(pdfImagesDir, pngFile);
    let pngBase64 = '';
    if (fs.existsSync(pngPath)) {
        pngBase64 = fs.readFileSync(pngPath).toString('base64');
    }
    return { title: data.title, html: renderedHtml, data: data, filename: file, pngBase64 };
});

// Build the combined Figma page — old design left, new design right, collapsible JSON
const figmaHtml = `<!DOCTYPE html>
<html lang="no">
<head>
    <meta charset="UTF-8">
    <title>Inntektsmelding - Alle scenarier (Figma Import)</title>
    <style type="text/css">
        @import url('https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@300;400;500;600&display=swap');

        * { font-family: "Source Sans 3", "Source Sans Pro", sans-serif; box-sizing: border-box; }
        p { margin: 0; padding: 0; }
        h3 { margin: 0; padding: 0; font-size: inherit; font-weight: inherit; border: none; }

        body {
            font-style: normal;
            font-weight: 400;
            font-size: 14px;
            color: #262626;
            line-height: 1.4;
            background: #f5f5f5;
            padding: 40px;
            display: flex;
            flex-direction: column;
            align-items: center;
        }

        .page-header {
            text-align: center;
            margin-bottom: 40px;
        }

        .page-header h1 {
            font-size: 32px;
            font-weight: 600;
            margin-bottom: 8px;
            border: none;
        }

        .page-header p {
            color: #666;
            font-size: 14px;
        }

        .scenario-block {
            margin-bottom: 80px;
            width: 100%;
            max-width: 1500px;
        }

        .scenario-heading {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
            font-size: 22px;
            font-weight: 600;
            color: #005B82;
            border: none;
            margin: 0 0 20px 0;
            padding: 0;
        }

        .scenario-heading span {
            font-size: 22px;
            font-weight: 600;
        }

        .scenario-row {
            display: flex;
            gap: 30px;
            justify-content: center;
            align-items: flex-start;
        }

        .scenario-old {
            flex: 0 0 600px;
            background: white;
            padding: 20px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            border-radius: 4px;
            overflow: hidden;
        }


        /* 1. Your existing rule applies to ALL scenarios by default */
        .scenario-old img {
            width: 100%;
            height: auto;
            display: block;
            margin-bottom: -320px; 
        }

        /* 2. This resets it back to normal for just these three cases */
        #scenario-1 .scenario-old img,
        #scenario-4 .scenario-old img,
        #scenario-10 .scenario-old img,
        #scenario-12 .scenario-old img {
            margin-bottom: 0;
        }

        .scenario-old .design-label {
            text-align: center;
            font-size: 12px;
            font-weight: 600;
            color: #666;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 12px;
        }

        .scenario-design {
            flex: 0 0 700px;
            background: white;
            padding: 40px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            border-radius: 4px;
        }

        .scenario-design .design-label {
            text-align: center;
            font-size: 12px;
            font-weight: 600;
            color: #666;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 12px;
            margin-top: -20px;
        }

        .json-toggle {
            padding: 6px 14px;
            background: #005B82;
            color: white;
            border: none;
            border-radius: 6px;
            font-size: 12px;
            font-weight: 500;
            cursor: pointer;
            font-family: "Source Sans 3", sans-serif;
        }

        .json-toggle:hover {
            background: #003d5c;
        }

        .scenario-json {
            display: none;
            max-width: 1500px;
            margin: 16px auto 0 auto;
            background: #1e1e1e;
            color: #d4d4d4;
            border-radius: 8px;
            padding: 20px;
            overflow-x: auto;
            font-family: "SF Mono", "Fira Code", "Consolas", monospace;
            font-size: 11px;
            line-height: 1.5;
            white-space: pre-wrap;
            word-break: break-word;
        }

        .scenario-json.open {
            display: block;
        }

        .toc {
            max-width: 600px;
            width: 100%;
            background: white;
            padding: 24px 32px;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.08);
            margin-bottom: 60px;
        }

        .toc-heading {
            font-size: 18px;
            font-weight: 600;
            border: none;
            margin: 0 0 12px 0;
            padding: 0;
            color: #262626;
        }

        .toc-list {
            margin: 0;
            padding-left: 20px;
        }

        .toc-list li {
            margin-bottom: 6px;
            font-size: 14px;
        }

        .toc-list a {
            color: #005B82;
            text-decoration: none;
        }

        .toc-list a:hover {
            text-decoration: underline;
        }

        /* Design styles for new template */
        .label { font-weight: 600; font-size: 13px; color: #262626; }
        .value { font-weight: 400; font-size: 14px; color: #262626; }
        .value-lg { font-weight: 500; font-size: 20px; color: #262626; }
        .detail { font-weight: 400; font-size: 13px; color: #4a515e; }

        .scenario-design .table { display: table; }
        .scenario-design .width-100 { width: 100%; }
        .scenario-design .row { display: table-row; }
        .scenario-design .cell { display: table-cell; }
        .bold { font-weight: 500; }
        .text-sm { font-size: 13px; }
        .text-lg { font-size: 18px; }
        .mb-1 { margin-bottom: 4px; }
        .mb-2 { margin-bottom: 8px; }
        .mb-3 { margin-bottom: 12px; }
        .mb-4 { margin-bottom: 16px; }
        .mt-2 { margin-top: 8px; }
        .scenario-design .info-box-cell { display: table-cell; border-radius: 8px; vertical-align: top; padding: 15px 20px; }
        .box-dark { background-color: #00213d; color: white; }
        .box-bright { background-color: #e6f0f7; color: black; }
        .scenario-design h1 { font-size: 26px; font-weight: 600; margin: 0; padding: 0; }
        .scenario-design h2 { font-size: 16px; font-weight: 600; border-top: 1px solid #e0e0e0; padding-top: 14px; margin-top: 18px; margin-bottom: 8px; }
        .grey-text { color: #4a515e; }
        .scenario-design .info-box-table { display: table; width: 100%; table-layout: fixed; border-collapse: separate; border-spacing: 10px 0; margin-left: -10px; margin-right: -10px; margin-bottom: 20px; margin-top: 10px; }
        .liten-label { margin-bottom: 2px; font-weight: 600; font-size: 11px; }
        .navn-datafelt { margin-bottom: 8px; font-weight: 500; font-size: 20px; }
        .period-row { background-color: #eef4f9; padding: 8px 15px; margin-bottom: 6px; border-radius: 8px; font-size: 13px; }
        .scenario-design hr { margin-top: 30px; border: 0; border-top: 1px solid #e0e0e0; }
    </style>
</head>
<body>

<div class="page-header">
    <h1>Inntektsmelding for sykepenger – Designscenarier</h1>
    <p>${scenarios.length} scenarier. Gammelt design til venstre, nytt design til høyre.</p>
    <br/>
    <p style="font-size: 18px;text-align: left;color: black;    max-width: 600px;">
        HAG skal gjøre en jobb med inntektsmeldingsvisningen i GOSYS (PDF) og ønsker tilbakemeldinger på om vi bør gjøre endringer i visningen. Ønsket er å vurdere om et nytt design kan gjøre det enklere å lese og behandle inntektsmeldinger.
        <br/><br/>
        <strong>Venstre</strong> = eksisterende design &nbsp;|&nbsp; <strong>Høyre</strong> = nytt forslag
        <br/><br/>
        Send gjerne tilbakemeldinger til <a href="slack://user?team=T5LNAMWNA&id=U07QBKPKWH5">Jesper Hustad på Slack</a> eller på e-post <a href="mailto:jesper.forrest.hustad@nav.no">jesper.forrest.hustad@nav.no</a>.
    </p>
</div>

<nav class="toc">
    <h2 class="toc-heading">Innhold</h2>
    <ol class="toc-list">
${scenarios.map((s, i) => `        <li><a href="#scenario-${i + 1}">${s.title}</a></li>`).join('\n')}
    </ol>
</nav>

${scenarios.map((s, i) => {
    const displayData = { ...s.data };
    delete displayData.title;
    const jsonStr = JSON.stringify(displayData, null, 2)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    return `
<div class="scenario-block" id="scenario-${i + 1}">
    <h2 class="scenario-heading"><span>Scenario ${i + 1}: ${s.title}</span> <button class="json-toggle" onclick="document.getElementById('json-${i + 1}').classList.toggle('open'); this.textContent = this.textContent === 'Vis JSON-data' ? 'Skjul JSON-data' : 'Vis JSON-data';">Vis JSON-data</button></h2>
    <div class="scenario-json" id="json-${i + 1}">${jsonStr}</div>
    <div class="scenario-row">
        <div class="scenario-old">
            <div class="design-label">Gammelt design (joark)</div>
            ${s.pngBase64 ? `<img src="data:image/png;base64,${s.pngBase64}" alt="Old PDF design"/>` : '<p style="color:#999;text-align:center;">Ingen PDF tilgjengelig</p>'}
        </div>
        <div class="scenario-design">
            <div class="design-label">Nytt design</div>
            ${s.html}
        </div>
    </div>
</div>`;
}).join('\n')}

</body>
</html>`;

const outputPath = path.join(__dirname, 'inntektsmelding_scenarier.html');
fs.writeFileSync(outputPath, figmaHtml);
console.log(`✓ Figma page generated: ${outputPath}`);
console.log(`  Contains ${scenarios.length} scenarios`);
console.log(`  File size: ${(fs.statSync(outputPath).size / 1024).toFixed(1)} KB`);
