/*Mahjong is based on draw-and-discard card games that were popular in 18th and
19th century China and some are still popular today.

In each deck, there are three different suits numbered 1 to 9, which are called
Simple tiles. They are Circles (denoted by [1-9]p), Bamboo (denoted by [1-9]s),
and Characters (denoted by [1-9]m).

Moreover, there is another suit named Honor tiles. It includes Wind tiles
(namely East, South, West, North, denoted by [1-4]z) and Dragon tiles
(namely Red, Green, White, denoted by [5-7]z).

In each of Mahjong games, each of the 4 players around the table has 13 tiles.
They take turns drawing a tile from the tile walls and then discarding one of
the tiles from their hands. One wins the game if that player holds a
combination of tiles as defined below:

A regular winning hand consists of 4 Melds and 1 Pair. Each meld of tiles
can be 3 identical or consecutive tiles of a suit, e.g. 222 or 456.
*/

/*
Task

Work out all tiles that can make up a winning hand with the given 13 tiles.
Remember that a winning hand may be regular or in a form of Seven-pairs.

Input
A string denoting 13 tiles to be computed, in the order of Circles ([1-9]p),
Bamboo ([1-9]s), Characters ([1-9]m), and Honors ([1-7]z). The tiles are
space-separated.
Output
A string consisting of the tiles that can form a winning hand with given ones,
in the order of Circles ([1-9]p), Bamboo ([1-9]s), Characters ([1-9]m),
and Honors ([1-7]z).
*/

const FOUR_MELDS_LEN = 12;
const HAND_LEN = FOUR_MELDS_LEN + 2;
const IDENTICAL_PIECES = 3;
const PAIR_LEN = 2;
const MAX_PIECES = 4;
const SEVEN_PAIRS = 7;
const PONG_WIN = 4;

const PONG_COMBINATIONS = {
  1: [ [0] ],
  2: [ [0], [1], [0, 1]],
  3: [ [0], [1], [2], [0, 1], [0, 2], [1, 2], [0, 1, 2]]
}

const hasWinningHand = (tiles, tile, suits) => {

  const hasSevenPairs = (counter) => {
    const numPairs = Object.keys(counter)
                    .map( (k) => { return Math.floor(counter[k] / 2); }  )
                    .reduce((sum, value) => {
                        return sum + value;
                    }, 0);
    return numPairs === SEVEN_PAIRS;
  }

  const restoreCount = (counts, hand) => {
    // restore value
    if (hand) {
      hand.split(' ').forEach((tile) => {
        counts[tile] += 1;
      });
    }
  };

  const buildThreeConsecutiveTiles = (combination, countsCopy, suits) => {
    for (let i = 1; i <= 7; i++) {
      let sheungCombination = '';
      for (let j = i; j <= 7; j++) {
        for (let k = 0; k < suits.length; k++) {
          const tile = `${j}${suits[k]}`;
          const nextTile = `${j+1}${suits[k]}`;
          const lastTile = `${j+2}${suits[k]}`;
          while (countsCopy[tile] >= 1 && countsCopy[nextTile] >= 1 && countsCopy[lastTile] >= 1) {
            countsCopy[tile] -= 1;
            countsCopy[nextTile] -= 1;
            countsCopy[lastTile] -= 1;
            sheungCombination += `${(sheungCombination > '' ? ' ' : '')}${tile} ${nextTile} ${lastTile}`;
          }
        }
      }
      const final_hand = `${combination} ${sheungCombination}`.trim();
      if (final_hand.split(' ').length === FOUR_MELDS_LEN) {
        return final_hand;
      } else {
        // restore value
        restoreCount(countsCopy, sheungCombination);
      }
    }
    return '';
  }

  const hasFourMelds = (hasHonorTile, counter, suits) => {

    // remove 3 identical pieces, from 0 to 4 groups
    const pongList = Object.keys(counter)
      .filter((t) => { return counter[t] >= IDENTICAL_PIECES; });

    const countsCopy = JSON.parse(JSON.stringify(counter));
    let pong = '', combo = null;

    // skip this, if there is honor tile
    // can a winning hand be made without pong
    let feasibleCombination = null;
    if (!hasHonorTile) {
      feasibleCombination = buildThreeConsecutiveTiles('', countsCopy, suits);
      if (feasibleCombination) {
        return feasibleCombination;
      }
    }

    // already a winning hand
    if (pongList.length === PONG_WIN) {
      return pongList.map((t) => {
        return `${tile} ${tile} ${tile}`
      }).join(' ');
    }

    if (pongList.length > 0) {
      // try pong 1, 2, 3 and up to 4 times
      const combos = PONG_COMBINATIONS[pongList.length];
      for (let w = 0; w < combos.length; w++) {
        pong = '';
        combo = combos[w];
        for (let k = 0; k < combo.length; k++) {
          const tile = pongList[combo[k]];
          countsCopy[tile] -= IDENTICAL_PIECES;
          pong += `${(pong > '' ? ' ' : '')}${tile} ${tile} ${tile}`;
        }  // end combine pong
        feasibleCombination = buildThreeConsecutiveTiles(pong, countsCopy, suits);
        if (feasibleCombination) { return feasibleCombination; }
        // restore value
        restoreCount(countsCopy, pong);
      } // end loop combos
      return '';
    }
    return '';
  }

  const hand = `${tiles} ${tile}`.split(' ');
  if (hand && hand.length !== HAND_LEN) { return false; }

  // count number of occurrences of of each tile in a hand
  const counts = hand.reduce((acc, o) => {
              acc[o] = (acc && acc[o] && acc[o] + 1) || 1;
              return acc;
          }, {});
  const pairs = Object.keys(counts).filter((t) => {
    return counts[t] >= PAIR_LEN;
  });

  if (hasSevenPairs(counts)) { return true; }
  const hasHonorTile = hand.indexOf('z') >= 0;

  for (let i = 0; i < pairs.length; i++) {
    counts[pairs[i]] -= PAIR_LEN;
    if (hasFourMelds(hasHonorTile, counts, suits)) { return true; }
    counts[pairs[i]] += PAIR_LEN;
  }
  return false;
}

const solution = (tiles) => {
  // for tile from 1 to 9, insert tile to tiles to form a hand with 14 tiles
  // if hand is a winning hand, then append tile to result
  // when done, return result
  console.log(tiles);
  const tilesArray = tiles.split(' ');
  //const startTime = new Date().getTime();
  let result = '';
  const suits = [];
  if (tiles.indexOf('p') >= 0) {
    suits.push('p');
  }
  if (tiles.indexOf('s') >= 0) {
    suits.push('s');
  }
  if (tiles.indexOf('m') >= 0) {
    suits.push('m');
  }
  const hasHonorTile = tiles.indexOf('z') >= 0;
  suits.forEach((suit) => {
    '123456789'.split('').forEach((i) => {
      const tile = `${i}${suit}`;
      const validPiece = tilesArray.filter((t) => { return t === tile; }).length < MAX_PIECES;
      if (validPiece && hasWinningHand(tiles, tile, suits)) {
        result += `${(result > '' ? ' ' : '')}${tile}`;
      }
    });
  });
  if (hasHonorTile) {
    for (let i = 1; i <= 7; i++) {
      // check honor tiles
      const tile = `${i}z`;
      const numPiece = tilesArray.filter((t) => { return t === tile; }).length;
      if (numPiece >= 1 && numPiece < MAX_PIECES) {
        if (hasWinningHand(tiles, tile, suits)) {
          result += `${(result > '' ? ' ' : '')}${tile}`;
        }
      }
    }
  }
  //const endTime = new Date().getTime();
  //console.log(`elapsed time: ${endTime - startTime}`);
  return result;
}

const cases = [
  ["2p 2p 3p 3p 4p 4p 5p 5p 7m 7m 8m 8m 8m", "2p 5p 7m 8m"],
  ["1p 1p 3p 3p 4p 4p 5p 5p 6p 6p 7p 7p 9p", "9p"],
  ["4p 5p 6p 6p 6p 7s 7s 7s 1m 1m 3z 3z 3z", "3p 6p 1m"],
  ["4p 4p 4p 4s 4s 4s 3m 3m 3m 4m 3z 3z 3z", "2m 4m 5m"],
  ["5p 5p 5p 6p 6p 9p 9p 9p 7s 8s 9s 3m 3m", "6p 3m"],
  ["1p 2p 3p 5s 5s 5s 6s 6s 7s 7s 8s 8s 9s", "4s 6s 7s 9s"],
  ["1p 1p 1p 3s 3s 3s 5s 5s 4m 5m 6m 5z 5z", "5s 5z"],
  ["1p 1p 1p 3s 3s 3s 5s 5s 5s 6s 6s 6s 5z", "5z"],
  ["1p 1p 1p 3p 4p 5p 5p 7p 3s 3s 8s 8s 8s", "6p"],
  ["3p 4p 5p 6p 7p 3s 4s 5s 1m 2m 3m 2z 2z","2p 5p 8p"]
];

cases.forEach((o) => {
  const [hand, expected] = o;
  const startTime = new Date().getTime();
  console.log(solution(hand) === expected);
  //console.log(solution(hand))
  const endTime = new Date().getTime();
  console.log(endTime - startTime);
})

console.log(solution("5p 6p 3s 3s 5s 7s 7s 9s 9s 7m 2z 5z 7z"));
