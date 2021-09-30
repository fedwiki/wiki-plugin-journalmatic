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

    // apply journal action to page
    function applyAction (page, action) {
      let index
      const order = () => Array.from(page.story || []).map((item) => (item != null ? item.id : undefined))

      const add = function (after, item) {
        const index = order().indexOf(after) + 1
        return page.story.splice(index, 0, item)
      }

      const remove = function () {
        let index
        if ((index = order().indexOf(action.id)) !== -1) {
          return page.story.splice(index, 1)
        }
      }

      if (!page.story) { page.story = [] }

      let after, item

      switch (action.type) {
        case 'create':
          if (action.item != null) {
            if (action.item.title != null) { page.title = action.item.title }
            if (action.item.story != null) { page.story = action.item.story.slice() }
          }
          break
        case 'add':
          add(action.after, action.item)
          break
        case 'edit':
          if ((index = order().indexOf(action.id)) !== -1) {
            page.story.splice(index, 1, action.item)
          } else {
            page.story.push(action.item)
          }
          break
        case 'move':
          // construct relative addresses from absolute order
          index = action.order.indexOf(action.id)
          after = action.order[index - 1]
          item = page.story[order().indexOf(action.id)]
          remove()
          add(after, item)
          break
        case 'remove':
          remove()
          break
      }

      if (!page.journal) { page.journal = [] }
      return page.journal.push(action)
    }


    // if we have a chronology problem, we check for a sorted revision problem
    // otherwise we just check for a revision problem
    if (chronError) {
      const sortedJournal = page.journal.sort(compare)

      // check for missing creation
      if (sortedJournal[0].type != 'create') {
        console.log('create not first action after sort!')
        checkerResults.set('creation', true)
      }

      let revPage = { title: page.title, story: [] }
      for (const action of sortedJournal || []) {
        applyAction(revPage, action || {})
      }
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

      let revPage = { title: page.title, story: [] }
      for (const action of page.journal || []) {
        applyAction(revPage, action || {})
      }
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

  console.log("results", checkerResults)

  return checkerResults
}

export { checkJournal }
