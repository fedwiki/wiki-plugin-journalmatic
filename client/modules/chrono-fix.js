function fixChronology ({pageJSON, site, slug}) {

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

  const journalIn = pageJSON.journal

  // sort the journal before we start just to be sure in correct order
  journalIn.sort(compare)


  // now to reconstruct the page

  // do we need be concerned with any none wiki content?
  let pageOut = {
    title: pageJSON.title,
    story: pageJSON.story,
    journal: journalIn
  }

  return pageOut

}

export { fixChronology }