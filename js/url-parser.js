module.exports = function parse (url) {
  if (url && !url.match(/^\w*:?[./]|^about:/)) {
    // probably a search query
    return [{
      type: 'search',
      content: url
    }]
  }
  let tokens = []
  let protocolMatch = url.match(/^(\w+:)/)
  if (protocolMatch) {
    tokens.push({
      type: 'protocol',
      content: protocolMatch[1]
    })
    url = url.substr(protocolMatch[0].length)
  }
  if (url.match(/^\/\//)) {
    tokens.push({
      type: 'slashes',
      content: '//'
    })
    url = url.substr(2)
  }
  let authMatch = url.match(/(\w+)?(:)?(\w+)?@/)
  if (authMatch) {
    if (authMatch.index !== 0) {
      tokens.push({
        type: 'text',
        content: url.substr(0, authMatch.index)
      })
    }
    if (authMatch[1]) {
      tokens.push({
        type: 'auth-user',
        content: authMatch[1]
      })
    }
    if (authMatch[2]) {
      tokens.push({
        type: 'auth-colon',
        content: ':'
      })
    }
    if (authMatch[3]) {
      tokens.push({
        type: 'auth-password',
        content: authMatch[3]
      })
    }
    tokens.push({
      type: 'auth-at',
      content: '@'
    })
    url = url.substr(authMatch.index + authMatch[0].length)
  }
  let hostMatch = url.match(/((?:\w+\.)*\w+|\[(?:[0-9a-f]*:)+[0-9a-f]+\])(:\d+)?/i)
  if (hostMatch) {
    if (hostMatch.index !== 0) {
      tokens.push({
        type: 'text',
        content: url.substr(0, hostMatch.index)
      })
    }
    if (hostMatch[1]) {
      tokens.push({
        type: 'hostname',
        content: hostMatch[1]
      })
    }
    if (hostMatch[2]) {
      tokens.push({
        type: 'port',
        content: hostMatch[2]
      })
    }
    url = url.substr(hostMatch.index + hostMatch[0].length)
  }
  let pathMatch = url.match(/(\/[^ ]*)/)
  if (pathMatch) {
    if (pathMatch.index !== 0) {
      tokens.push({
        type: 'text',
        content: url.substr(0, pathMatch.index)
      })
    }
    tokens.push({
      type: 'path',
      content: pathMatch[1]
    })
    url = url.substr(pathMatch.index + pathMatch[0].length)
  }
  if (url) {
    tokens.push({
      type: 'text',
      content: url
    })
  }
  return tokens
}
