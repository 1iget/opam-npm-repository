exports.camelize = function(s) {
  return s.replace(/(^|_)([a-z0-9])/g, function(m, underscore, character) {
    return character.toUpperCase();
  });
};

exports.underscore = function(s) {
  return s.replace(/(^|[a-z0-9])([A-Z0-9])/g, function(m, before, character) {
    return (before)
      ? before+'_'+character.toLowerCase()
      : character.toLowerCase();
  });
};