import {propArray, propArrayInObj, propObj} from './props'

/**
 * Map values by given prop.
 *
 * @param {Array} array of values
 * @param {String} original property
 * @return {String} mapped values
 */
function mapValuesByProp(value, prop) {
  return value.map((item) => objectToString(item, prop))
}

/**
 * Convert array to string.
 *
 * @param {Array} array of values
 * @param {String} original property
 * @param {Object} sheme, for converting arrays in strings
 * @return {String} converted string
 */
function arrayToString(value, prop, scheme) {
  if (value[0].constructor === Object) return mapValuesByProp(value, prop)
  if (scheme[prop] == null) return value.join(',')
  if (value[0].constructor === Array) {
    return arrayToString(value[0], prop, scheme)
  }
  return value.join(' ')
}

/**
 * Convert object to string.
 *
 * @param {Object} object of values
 * @param {String} original property
 * @return {String} converted string
 */
function objectToString(value, prop) {
  if (!propObj[prop]) return ''

  const result = []

  for (const baseProp in propObj[prop]) {
    if (value[baseProp]) {
      if (value[baseProp].constructor === Array) {
        result.push(arrayToString(value[baseProp], baseProp, propArrayInObj))
      }
      else result.push(value[baseProp])
      continue
    }

    // Add default value from props config.
    if (propObj[prop][baseProp] != null) {
      result.push(propObj[prop][baseProp])
    }
  }

  return result.join(' ')
}

/**
 * Detect if a style needs to be converted.
 *
 * @param {Object} style
 * @return {Object} convertedStyle
 */
function styleDetector(style) {
  for (const prop in style) {
    const value = style[prop]

    if (value.constructor === Object) {
      if (prop === 'fallbacks') style[prop] = styleDetector(style[prop])
      else style[prop] = objectToString(value, prop)
      continue
    }

    // Check double arrays to avoid recursion.
    if (value.constructor === Array && value[0].constructor !== Array) {
      if (prop === 'fallbacks') {
        for (let index = 0; index < style[prop].length; index ++) {
          style[prop][index] = styleDetector(style[prop][index])
        }
        continue
      }

      style[prop] = arrayToString(value, prop, propArray)
    }
  }
  return style
}

/**
 * Adds possibility to write expanded styles.
 *
 * @param {Rule} rule
 * @api public
 */
export default function jssExpand() {
  return (rule) => {
    const {style, type} = rule
    if (!style || type !== 'regular') return

    if (Array.isArray(style)) {
      // Pass rules one by one and reformat them
      for (let index = 0; index < style.length; index++) {
        style[index] = styleDetector(style[index])
      }
      return
    }

    rule.style = styleDetector(style)
  }
}
