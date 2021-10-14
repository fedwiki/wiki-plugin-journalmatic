import { revision } from './revision.js'

function checkJournal (pageJSON, site, slug) {
  
  const checkerResults = new Map()

  function compare (a, b) {
    try {
      if (a.date < b.date) {
        return -1
      }
      if (a.date > b.date) {
        return 1
      }
      return 0
    } catch (error) {
      // date missing, or equal, so...
      return 0
    }
  }

  function basicChecks (page) {
    // check for nulls
    const isNotNull = (item) => (!item || !item.type)
    // an empty page is not a nulls error!
    if (page.story.length != 0) {
      if (page.story.every(isNotNull)) {
        console.info('Nulls found')
        checkerResults.set('nulls', true)
      }
    }

    // check for huge and bloated journal
    const storyLength = JSON.stringify(page.story, null, 2).length
    const journalLength = JSON.stringify(page.journal || [], null, 2).length
    if (storyLength + journalLength > 5000000) {
      console.info('Page is HUGE')
      checkerResults.set('huge', true)
    }
    if (storyLength > 5000 && journalLength > 20 * storyLength) {
      console.info('Journal is bloated')
      checkerResults.set('bloated', true)
    }

    // check chronology
    let chronError = false
    let date = null
    for (const action of page.journal) {
      if (date && action.date && date > action.date) {
        console.info('Journal is out of order')
        checkerResults.set('chronology', true)
        chronError = true
        break
      }
      date = action.date
    }

    // check journal can recreate current page




    // if we have a chronology problem, we check for a sorted revision problem
    // otherwise we just check for a revision problem
    if (chronError) {
      const sortedJournal = page.journal.sort(compare)

      // check for missing creation
      if (sortedJournal[0].type != 'create') {
        console.log('create not first action after sort!')
        checkerResults.set('creation', true)
      }

      const revIndex = sortedJournal.length
      const revPage = revision({ revIndex, journal: sortedJournal, title: page.title })

      if (JSON.stringify(page.story) !== JSON.stringify(revPage.story)) {
        console.info('Sorted journal has revision problem', { page, revPage })
        checkerResults.set('revision', true)
      }
    } else {
      
      // check for missing creation
      if (page.journal[0].type != 'create') {
        console.log('create not first action!')
        checkerResults.set('creation', true)
      }

      const revIndex = page.journal.length
      const revPage = revision({ revIndex, journal: page.journal, title: page.title })

      if (JSON.stringify(page.story) !== JSON.stringify(revPage.story)) {
        console.info('Revision problem', { page, revPage })
        checkerResults.set('revision', true)
      }
    }
  }

  // some initial basic checks
  try {
    basicChecks(pageJSON)
  } catch (error) {
    console.error('Checks fail with', error)
    checkerResults.set('checks', true)
  }

  return checkerResults
}

export { checkJournal }
