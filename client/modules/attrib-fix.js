function fixAttribution({ pageJSON, site, slug }) {
  const journalIn = pageJSON.journal

  // now look for any attritution ending with ':'

  const journalOut = journalIn.map(entry => {
    if (entry.site?.endsWith(':')) {
      entry.site = entry.site.slice(0, -1)
    }

    if (entry.attribution?.site?.endsWith(':')) {
      entry.attribution.site = entry.attribution.site.slice(0, -1)
    }

    return entry
  })

  // do we need be concerned with any none wiki content?
  let pageOut = {
    title: pageJSON.title,
    story: pageJSON.story,
    journal: journalOut,
  }

  return pageOut
}

export { fixAttribution }
