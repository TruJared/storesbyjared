exports.playground = (req, res) => {
  res.render('playground', {
    title: 'what game',
    name: 'jared',
    cat: 'molly',
    currentGame: 'dark souls',
  });
};
//  TIP: Get Data From URL
//   >> takes advantage of middleware in app.js
//   >> app.use(bodyParser.json());
//   >> app.use(bodyParser.urlencoded({ extended: true }));

//  http://someurl/?name=jared&age=100

//  res.send(req.query.name) // jared
//  res.json(req.query) // {'name': 'jared', 'age': '100'}

// also can be used with variables, etc...
// http://someurl/reverse/jared
// deraj

// router.get('/reverse/:name', (req, res) => {
//   const reverse = [...req.params.name].reverse().join('');
//   res.send(reverse);
// });
