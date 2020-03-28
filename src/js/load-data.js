/* global d3 */
function loadFile(file) {
  return new Promise((resolve, reject) => {
    const ext = file.split('.').pop();
    if (ext === 'csv')
      d3.dsv("|",`assets/data/${file}`)
        .then(resolve)
        .catch(reject);
    else if (ext === 'json')
      d3.json(`assets/data/${file}`)
        .then(resolve)
        .catch(reject);
    else reject(new Error(`unsupported file type for: ${file}`));
  });
}

export default function loadData(files) {
  if (typeof files === 'string') return loadFile(files);
  const loads = files.map(loadFile);
  return Promise.all(loads);
}
