var $ = { a:
  { z: 'foo'
  , c:
    { foo: 4
    , baz: [2, 5]
    }
  , bla: null
  , special:
    { bar: 'bar'
    , toString: function() {
        return "[object Special]"
      }
    }
  }
, 'I am the best': function() {
    if (true)
      return 'test'
  }
}
$.a.c.nested = $
represent($)
