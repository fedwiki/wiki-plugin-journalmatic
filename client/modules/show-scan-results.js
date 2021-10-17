function showScanResults ({ results }) {

  const resultDiv = document.querySelector('#results')
  const template = document.querySelector('#results-line')

  if (results.has('nulls')) {
    let clone = template.content.cloneNode(true)
    clone.querySelector('span').textContent = 'NULLS'
    clone.querySelector('p').append(' story contains null items or null type in item.')
    resultDiv.appendChild(clone)
  }

  if (results.has('huge')) {
    let clone = template.content.cloneNode(true)
    clone.querySelector('span').textContent = 'HUGE'
    clone.querySelector('p').append(' page is too big to fork, greater than 5 MB.')
    resultDiv.appendChild(clone)
  }

  if (results.has('bloated')) {
    let clone = template.content.cloneNode(true)
    clone.querySelector('span').textContent = 'BLOATED'
    clone.querySelector('p').append(' journal is more than twenty times bigger than story.')
    resultDiv.appendChild(clone)
  }

  if (results.has('creation')) {
    let clone = template.content.cloneNode(true)
    clone.querySelector('span').textContent = 'CREATION'
    clone.querySelector('p').append(' page creation is not first action, or missing.')
    resultDiv.appendChild(clone)
  }

  if (results.has('chronology')) {
    let clone = template.content.cloneNode(true)
    clone.querySelector('span').textContent = 'CHRONOLOGY'
    clone.querySelector('p').append(' journal contains items out of chronological order.')
    resultDiv.appendChild(clone)
  }

  if (results.has('revision')) {
    let clone = template.content.cloneNode(true)
    clone.querySelector('span').textContent = 'REVISION'
    clone.querySelector('p').append(' journal cannot construct the current version.')
    resultDiv.appendChild(clone)
  }

  if (results.has('checks')) {
    let clone = template.content.cloneNode(true)
    clone.querySelector('span').textContent = 'CHECK FAIL'
    clone.querySelector('p').append(' a check has failed to run.')
    resultDiv.appendChild(clone)
  }

  if (results.has('malformed')) {
    let clone = template.content.cloneNode(true)
    clone.querySelector('span').textContent = 'MALFORMED'
    clone.querySelector('p').append(' journal contains actions that are malformed.')
    resultDiv.appendChild(clone)
  }
}

export { showScanResults }