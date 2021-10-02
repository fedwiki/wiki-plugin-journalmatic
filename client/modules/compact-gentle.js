function compactJournal ({pageJSON, site, slug}) {

  function compare(a, b) {
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

  const entryTimeSpan = 300000 // 5 minutes - maybe make this a parameter

  const journalIn = pageJSON.journal

  // sort the journal before we start just to be sure in correct order
  journalIn.sort(compare)

  // let journalMap = new Map() // used in take 1
  let journalOut = []

  let previousAction = null
  
  for (const action of journalIn) {
    //console.log('Previous Action', previousAction)
    //console.log('Action', action)
    switch (action.type) {
      case 'create':
        journalOut.push(action)
        break;
      case 'edit':
        if (previousAction === null) {
          previousAction = action
        } else {
          if (previousAction.id == action.id) {
            // previous action for the same item
            if (previousAction.type == action.type) {
              // previous action was also the same type
              if (previousAction.date + entryTimeSpan > action.date) {
                // and within the edit window
                previousAction = action
              } else {
                // previous action was sometime ago
                journalOut.push(previousAction)
                previousAction = action
              }
            } else {
              // not the same type of action
              journalOut.push(previousAction)
              previousAction = action
            }
          } else {
            // for a different item
            journalOut.push(previousAction)
            previousAction = action
          }
        }
        break;
      case 'add':
      case 'move':
      case 'remove':
        //
        if (previousAction != null) {
          journalOut.push(previousAction)
          previousAction = null
        }
        journalOut.push(action)
        break;
      case 'fork':
        if (action.site != null ) {
          // fork is from another site
          if (previousAction != null) {
            journalOut.push(previousAction)
            previousAction = null
          }
          journalOut.push(action)
        }
        break;
      default:
        // should never get here
        console.log("*** Extra Type:", action.type)
        break;
    }  
  }
  // make sure we write out the final action
  if (previousAction != null) {
    journalOut.push(previousAction)
  }

  // sort the journal just to be sure in correct order
  journalOut.sort(compare)

  console.info('journal (in)', journalIn.length)
  console.info('journal (out)', journalOut.length)

  // now to reconstruct the page

  // do we need be concerned with any none wiki content?
  let pageOut = {
    title: pageJSON.title,
    story: pageJSON.story,
    journal: journalOut
  }

  return pageOut

}

export { compactJournal }