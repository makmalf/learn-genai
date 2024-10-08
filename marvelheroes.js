import md5 from "md5";

const modules = {
  'characters': {
    param: 'nameStartsWith',
    field: 'name'
  },
  'comics': {
    param: 'titleStartsWith',
    field: 'title'
  }
}
// get the APIs from https://developer.marvel.com/documentation/authorization
export async function marvelheroes(module, keyword) {
  if (Object.keys(modules).includes(module)) {
    const params = new URLSearchParams({
      limit: '5',
      ts: '12345678910',
      apikey: process.env.MARVEL_PUB_KEY,
      hash: md5('12345678910'+process.env.MARVEL_PRIV_KEY+process.env.MARVEL_PUB_KEY)
    });

    if (modules[module].param && keyword) {
      params.append(modules[module].param, keyword)
    }

    const url = `http://gateway.marvel.com/v1/public/${module}?${params}`;
    const response = await fetch(url, {
      method: 'GET'
    });

    console.log(`fetching... ${url}`)
    const data = await response.json();
    console.log(data)
    if (data.data?.results.length) {
      const results = data.data?.results.map(result => {
        return `${result[modules[module].field]} --- ${result.description}`
      })
      return `${results.join(',')}`;
    } else {
      return null
    }
  }
  return null
}