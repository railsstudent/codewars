/*

Simplified SQL

We will be using a greatly simplified version of SQL. Your query engine will
need to handle SQL queries comprising only the following:

A SELECT clause, with any number of columns,
A FROM clause, which identifies the primary table to select records from,
Any number of optional JOIN clauses which join another table to the table
identified by the FROM clause, all of which will be treated as INNER JOINs.
An optional WHERE clause with only one condition.

 All table and column names will be simple strings with no spaces. Constant
 strings will be written in normal SQL format, with single quotes and escaping
 internal single quotes by doubling them (for example, 'a ''string''
 containing quotes').
*/
function SQLEngine(database){

  const OPERATORS = ['<=', '>=', '<>', '=', '<', '>'];
  const reFrom =  /FROM/i;
  const reJoin =  /JOIN/i;
  const reWhere = /WHERE/i;
  const reON = /ON/i;

  this.database = database;

  this.getTableData = (tableName) => {
      let table = this.database[tableName];

      return table.map((rowObj) => {
            let mapData = Object.keys(rowObj).reduce((rowMap, k) => {
                //let [k, v] = entry;
                rowMap[tableName + '.' + k] = rowObj[k];
                return rowMap;
            }, {});
            return mapData;
        });
  };

  this.parseCondition = (condition) => {
    let op = OPERATORS.find((op) => { return condition.indexOf(op) >= 0; });
    let idxOp = condition.indexOf(op);

    let leftCondField = condition.substring(0, idxOp).trim();
    let rightCondField = condition.substring(idxOp + op.length).trim();
    let isLeftFieldColumn = leftCondField.indexOf('.') >= 0;

    let [condColumn, condField] = isLeftFieldColumn ?
      [ leftCondField, rightCondField] : [ rightCondField, leftCondField];

    let constValue = condField;
    // single quote string
    if (condField.indexOf('\'') >= 0) {
      constValue = condField.substring(1, condField.length - 1);
      // replace internal double single quote with single quote
      if (constValue.indexOf('\'\'') >= 0) {
        constValue = constValue.replace('\'\'', '\'');
      }
    } else if (!isNaN(condField)) {
      constValue = Number(condField);
    }

    let f = null;
    if (op === '=') {
      f = (x, y) => { return x === y; };
    } else if (op === '<=') {
      f = (x, y) => { return x <= y; };
    } else if (op === '>=') {
      f = (x, y) => { return x >= y; };
    } else if (op === '<') {
      f = (x, y) => { return x < y; };
    } else if (op === '>') {
      f = (x, y) => { return x > y; };
    } else if (op === '<>') {
      f = (x, y) => { return x !== y; };
    }

    return {
      condColumn: condColumn,
      constValue: constValue,
      func: f
    };
  }

  this.filterResult = (results, strQuery, idxWhere) => {

    if (idxWhere >= 0) {
      let condition = strQuery.substring(idxWhere + 5).trim();
      let { condColumn, constValue, func } = this.parseCondition(condition);

      return results.reduce((acc, record) => {
        if (func(record[condColumn], constValue)) {
          acc.push(record);
        }
        return acc;
      }, []);
    }
    return results;
  }

  this.projection = (results, strQuery, idxFrom) => {

      let projectedFields = strQuery.substring(6, idxFrom).trim()
                  .replace(/\s/g, '').split(',');

      return results.map((rowObj) => {
            return projectedFields.reduce((rowMap, f) => {
                    rowMap[f] = rowObj[f];
                    return rowMap;
                }, {});
        });
  };

  this.joinCondition = (results, joinClause) => {
    // JOIN <table> ON <value> <operator> <value>
    let {joinTableName, condColumn, constValue, func} = joinClause;
    let tableData = this.getTableData(joinTableName);

    let newResults = results.reduce((acc, rowObj) => {
      acc = tableData.reduce((acc1, rowObj1) => {
        let leftValue, rightValue;
        if (rowObj[condColumn]) {
          leftValue = rowObj[condColumn];
          rightValue = rowObj1[constValue];
        } else {
          leftValue = rowObj[constValue];
          rightValue = rowObj1[condColumn];
        }

        let joinRecord = {};
        Object.keys(rowObj).forEach((k) => {
           joinRecord[k] = rowObj[k];
        });
        Object.keys(rowObj1).forEach((k) => {
           joinRecord[k] = rowObj1[k];
        });

        if (func(leftValue, rightValue)) {
          acc1.push(joinRecord);
        }
        return acc1;
      }, acc);
      return acc;
    }, []);
    return newResults;
  }

  this.joinConditions = (results, strQuery, idxWhere) => {

      // parse strQuery to extract all the join clauses
      // iterate join clauses, pass the intermediate results and join
      // clause to this.joinCondition to determine the new result set
      let joinClauses = [];
      let idxJoin = strQuery.search(reJoin);
      while (idxJoin >= 0) {
        let idxNextJoin = strQuery.substring(idxJoin + 4).search(reJoin);
        let joinStmt = '';
        if (idxNextJoin >= 0) {
          joinStmt = strQuery.substring(idxJoin + 4, idxNextJoin + idxJoin + 4).trim();
          idxJoin = idxNextJoin + idxJoin + 4;
        } else {
          // check for where clause
          if (idxWhere >= 0) {
            joinStmt = strQuery.substring(idxJoin + 4, idxWhere).trim();
          } else {
            joinStmt = strQuery.substring(idxJoin + 4).trim();
          }
          idxJoin = -1;
        }
        let idxOn = joinStmt.search(reON);
        let joinTableName = joinStmt.substring(0, idxOn).trim();
        let joinCondition = joinStmt.substring(idxOn + 2).replace(/\s/g, '');
        let joinInfo  = this.parseCondition(joinCondition);
        joinInfo['joinTableName'] = joinTableName;
        joinClauses.push(joinInfo);
      }

      joinClauses.forEach((joinClause) => {
        results = this.joinCondition(results, joinClause);
      })
      return results;
  }

  this.execute = (query) => {

    // 1) Find fields to query
    //    - search select and from and find the field names in between
    //    - split the field by comma
    //    - for each field, extract table name and column name and store them
    // 2) Get primary table in From clause
    // 3) Multiple join
    // 4) search Where and extract the condition
    //    - determine comparison operator
    //      =, <, <=, >, >=, <>.
    //    - determine values of the condition, column or constant
    //      if it is constant, a number or a quoted string
    //  5) Perform FROM-JOIN to form the result select
    //  6) Filter result set by where clause
    //  7) Do projection

    let strQuery = query.trim();
    console.log(strQuery);
    let idxFrom = strQuery.search(reFrom);
    let idxJoin = strQuery.search(reJoin);
    let idxWhere = strQuery.search(reWhere);
    let idxNextKeyword = idxJoin >= 0 ? idxJoin : (idxWhere > 0 ? idxWhere : query.length);

    let primaryTableName = strQuery.substring(idxFrom + 4, idxNextKeyword).trim();

    let results = this.getTableData(primaryTableName);
    results = this.joinConditions(results, strQuery, idxWhere);
    results = this.filterResult(results, strQuery, idxWhere);
    results = this.projection(results, strQuery, idxFrom);

    return results;
  }
}



var movieDatabase = {
  movie: [
    { id: 1, name: 'Avatar', directorID: 1 },
    { id: 2, name: 'Titanic', directorID: 1 },
    { id: 3, name: 'Infamous', directorID: 2 },
    { id: 4, name: 'Skyfall', directorID: 3 },
    { id: 5, name: 'Aliens', directorID: 1 },
    { id: 6, name: 'Pirates of the Caribbean: Dead Man\'s Chest', directorID: 9 },
  ],
  actor: [
    { id: 1, name: 'Leonardo DiCaprio' },
    { id: 2, name: 'Sigourney Weaver' },
    { id: 3, name: 'Daniel Craig' },
     { id: 9, name: 'Gore Verbinski' },
  ],
  director: [
    { id: 1, name: 'James Cameron' },
    { id: 2, name: 'Douglas McGrath' },
    { id: 3, name: 'Sam Mendes' }
  ],
  actor_to_movie: [
    { movieID: 1, actorID: 2 },
    { movieID: 2, actorID: 1 },
    { movieID: 3, actorID: 2 },
    { movieID: 3, actorID: 3 },
    { movieID: 4, actorID: 3 },
    { movieID: 5, actorID: 2 },
  ]
};

let engine = new SQLEngine(movieDatabase);
let actual = engine.execute('SELECT movie.name FROM movie');
console.log(actual);

let actual2 = engine.execute('SELECT movie.name, movie.directorID FROM movie');
console.log(actual2);

let actual3 = engine.execute('SELECT movie.name, movie.directorID FROM movie WHERE movie.directorID >= 2');
console.log(actual3);

let actual3a = engine.execute('SELECT movie.name, movie.id FROM movie WHERE movie.name = \'Titanic\'');
console.log(actual3a);

let actual4 = engine.execute('SELECT movie.name, director.name '
                           +'FROM movie '
                           +'JOIN director ON director.id = movie.directorID');
console.log(actual4);

let actual6 = engine.execute('SELECT movie.name, director.name '
                           +'FROM director '
                           +'JOIN movie ON director.id = movie.directorID');
console.log(actual6);

let actual7 = engine.execute('SELECT movie.name, director.name '
                           +'FROM director '
                           +'JOIN movie ON director.id = movie.directorID '
                           +'WHERE director.name = \'Sam Mendes\'');
console.log(actual7);

let actual5 = engine.execute('SELECT movie.name, actor.name '
                           +'FROM movie '
                           +'JOIN actor_to_movie ON actor_to_movie.movieID = movie.id '
                           +'JOIN actor ON actor_to_movie.actorID = actor.id '
                           +'WHERE actor.name <> \'Daniel Craig\'');
console.log(actual5);

let actual8 = engine.execute('SELECT movie.name FROM movie '
                            + 'WHERE movie.name = \'Pirates of the Caribbean: Dead Man\'\'s Chest\'');
console.log(actual8);

/*describe('execution',function(){
  var engine = new SQLEngine(movieDatabase);

  it('should SELECT columns', function(){
    var actual = engine.execute('SELECT movie.name FROM movie');
    assertSimilarRows(actual, [{'movie.name':'Avatar'},
                                {'movie.name':'Titanic'},
                                {'movie.name':'Infamous'},
                                {'movie.name':'Skyfall'},
                                {'movie.name':'Aliens'}]);
  });

  it('should apply WHERE', function(){
    var actual = engine.execute('SELECT movie.name FROM movie WHERE movie.directorID = 1');
    assertSimilarRows(actual, [{'movie.name':'Avatar'},
                                {'movie.name':'Titanic'},
                                {'movie.name':'Aliens'}]);
  });

  it('should perform parent->child JOIN', function(){
    var actual = engine.execute('SELECT movie.name, director.name '
                               +'FROM movie '
                               +'JOIN director ON director.id = movie.directorID');
    assertSimilarRows(actual, [{'movie.name':'Avatar','director.name':'James Cameron'},
                                {'movie.name':'Titanic','director.name':'James Cameron'},
                                {'movie.name':'Aliens','director.name':'James Cameron'},
                                {'movie.name':'Infamous','director.name':'Douglas McGrath'},
                                {'movie.name':'Skyfall','director.name':'Sam Mendes'}]);
  });

  it('should perform child->parent JOIN ', function(){
    var actual = engine.execute('SELECT movie.name, director.name '
                               +'FROM director '
                               +'JOIN movie ON director.id = movie.directorID');
    assertSimilarRows(actual, [{'movie.name':'Avatar','director.name':'James Cameron'},
                                {'movie.name':'Titanic','director.name':'James Cameron'},
                                {'movie.name':'Infamous','director.name':'Douglas McGrath'},
                                {'movie.name':'Skyfall','director.name':'Sam Mendes'},
                                {'movie.name':'Aliens','director.name':'James Cameron'}]);
  });

  it('should perform many-to-many JOIN and apply WHERE', function(){
    var actual = engine.execute('SELECT movie.name, actor.name '
                               +'FROM movie '
                               +'JOIN actor_to_movie ON actor_to_movie.movieID = movie.id '
                               +'JOIN actor ON actor_to_movie.actorID = actor.id '
                               +'WHERE actor.name <> \'Daniel Craig\'');
    assertSimilarRows(actual, [{'movie.name':'Aliens','actor.name':'Sigourney Weaver'},
                                {'movie.name':'Avatar','actor.name':'Sigourney Weaver'},
                                {'movie.name':'Infamous','actor.name':'Sigourney Weaver'},
                                {'movie.name':'Titanic','actor.name':'Leonardo DiCaprio'}]);
  });

});

function assertSimilarRows(actual, expected, message){
  function logFailed(m, rows){
    Test.expect(false, m +'<pre>' + rows.map(JSON.stringify).join(',\n') + '</pre>');
  }
  if(!actual || actual.length == 0 || !expected || expected.length == 0){
    return Test.assertSimilar(actual, expected, message);
  }
  function allPropertiesInLeftInRight(a,b){
    return Object.keys(a).every(function(ak){ return a[ak] == b[ak]; })
  }
  function similarObjects(a,b){
    return allPropertiesInLeftInRight(a,b) && allPropertiesInLeftInRight(b,a);
  }
  function getRowsInLeftWhichAreNotInRight(left, right){
    return left.filter(function(r){
                  return !right.some(function(a){ return similarObjects(a,r); });
                });
  }
  var missingRowsInActual = getRowsInLeftWhichAreNotInRight(expected, actual),
      extraRowsInActual = getRowsInLeftWhichAreNotInRight(actual, expected);
  if(missingRowsInActual.length > 0){
    logFailed('Failure: expected result to include the following rows, but they were missing: ', missingRowsInActual);
    return;
  }
  if(extraRowsInActual.length > 0){
    logFailed('Failure: result contained the following rows which were not expected: ', extraRowsInActual);
    return;
  }

  Test.expect(true, message);
}*/
