// apply journal action to page
function applyAction (page, action) {
  let index

  const order = () => Array.from(page.story || []).map((item) => (item != null ? item.id : undefined))
// the order function looks somewhat different from that generated from the client coffeescript
/* 
order = function() {
      var i, item, len, ref, results;
      ref = page.story || [];
      results = [];
      for (i = 0, len = ref.length; i < len; i++) {
        item = ref[i];
        results.push(item != null ? item.id : void 0);
      }
      return results;
    };

original coffeescript:
  order = ->
    (item?.id for item in page.story||[])
*/

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

  // if (!page.journal) { page.journal = [] }
  page.journal || (page.journal = [])
  return page.journal.push(action)
}

function revision ({ revIndex, journal, title }) {
  const revJournal = journal.slice(0, revIndex || journal.length)
  const revPage = { 
    title, 
    story: [] 
  }
  for (const action of revJournal || []) {
    applyAction(revPage, action || {})
  }
  return revPage
}

export { revision }