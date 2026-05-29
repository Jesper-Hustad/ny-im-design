const fs = require('fs');
const path = require('path');
const Handlebars = require('handlebars');

// Register helpers
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
const templateSource = fs.readFileSync(path.join(__dirname, 'template.hbs'), 'utf8');
const template = Handlebars.compile(templateSource);

// Read style — v2 with coherent typography
const style = `<style type="text/css">
    @import url('https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@300;400;500;600&display=swap');

    * { font-family: "Source Sans 3", "Source Sans Pro", sans-serif; }
    p { margin: 0; padding: 0; }
    h3 { margin: 0; padding: 0; font-size: inherit; font-weight: inherit; border: none; }
    body { font-style: normal; font-weight: 400; font-size: 14px; margin: 1cm; color: #262626; line-height: 1.5; }
    .table { display: table; }
    .width-100 { width: 100%; }
    .row { display: table-row; }
    .cell { display: table-cell; }

    /* Coherent typography system */
    .label { font-weight: 600; font-size: 13px; color: #262626; }
    .value { font-weight: 400; font-size: 14px; color: #262626; }
    .value-lg { font-weight: 500; font-size: 20px; color: #262626; }
    .detail { font-weight: 400; font-size: 13px; color: #4a515e; }

    .bold { font-weight: 500; }
    .text-sm { font-size: 13px; }
    .text-lg { font-size: 18px; }

    /* Spacing */
    .mb-1 { margin-bottom: 4px; }
    .mb-2 { margin-bottom: 8px; }
    .mb-3 { margin-bottom: 12px; }
    .mb-4 { margin-bottom: 16px; }
    .mt-2 { margin-top: 8px; }

    .info-box-cell { display: table-cell; border-radius: 8px; vertical-align: top; padding: 15px 20px; }
    .box-dark { background-color: #00213d; color: white; }
    .box-bright { background-color: #e6f0f7; color: black; }
    table { width: 100%; border-collapse: collapse; }
    h1 { font-size: 26px; font-weight: 600; margin: 0; padding: 0; }
    h2 { font-size: 16px; font-weight: 600; border-top: 1px solid #e0e0e0; padding-top: 14px; margin-top: 18px; margin-bottom: 8px; }
    .grey-text { color: #4a515e; }
    .info-box-table { display: table; width: 100%; table-layout: fixed; border-collapse: separate; border-spacing: 10px 0; margin-left: -10px; margin-right: -10px; margin-bottom: 20px; margin-top: 10px; }
    .liten-label { margin-bottom: 2px; font-weight: 600; font-size: 11px; }
    .navn-datafelt { margin-bottom: 8px; font-weight: 500; font-size: 20px; }
    .period-row { background-color: #eef4f9; padding: 8px 15px; margin-bottom: 6px; border-radius: 8px; font-size: 13px; }
    hr { margin-top: 30px; border: 0; border-top: 1px solid #e0e0e0; }
</style>`;

// Process all scenario files
const scenariosDir = path.join(__dirname, 'scenarios');
const outputDir = path.join(__dirname, 'output');

if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

const files = fs.readdirSync(scenariosDir).filter(f => f.endsWith('.json')).sort();

console.log(`Processing ${files.length} scenarios...`);

files.forEach(file => {
    const data = JSON.parse(fs.readFileSync(path.join(scenariosDir, file), 'utf8'));
    const html = template(data);
    const fullHtml = `<!DOCTYPE html>
<html lang="no">
<head>
    <meta charset="UTF-8">
    <title>${data.title || 'Inntektsmelding'}</title>
    ${style}
</head>
<body>
${html}
</body>
</html>`;

    const outputFile = file.replace('.json', '.html');
    fs.writeFileSync(path.join(outputDir, outputFile), fullHtml);
    console.log(`  ✓ ${outputFile}`);
});

console.log(`\nDone! ${files.length} HTML files written to output/`);
