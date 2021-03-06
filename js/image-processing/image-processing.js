/*

Parameters

imageData: a flat (one-dimensional) array of the image data. The data is organized 
by row and then by column, and then one byte for each color channel red, green, and blue. 
These values will always be integers in the range 0-255.
For example, given the image:
A B C
D E F
G H I
The input array would be:

[
  A_Red, A_Green, A_Blue, B_Red, B_Green, B_Blue, C_Red, C_Green, C_Blue, 
  D_Red, D_Green, D_Blue, E_Red, E_Green, E_Blue, F_Red, F_Green, F_Blue,
  G_Red, G_Green, G_Blue, H_Red, H_Green, H_Blue, I_Red, I_Green, I_Blue
]

height: the number of rows of the image.
width: the number of columns of the image.
weights: an n x n array giving the weights for each of the neighboring pixels. 
The size of this array, n, will always be odd, with the center being the weight 
of the pixel itself. The array is by row and then column. I.e. weights[y][x]

Return

An array of the image data adjusted by the weighted average per pixel's neighborhood. 
Where the weights matrix specifies pixels outside the actual image, use the values of 
the closest pixel. (E.g. extend the edges as far as necessary to provide values 
for the matrix.) Each value should be in the range 0-255.

*/
// http://setosa.io/ev/image-kernels/

  // map the one-dimensional array to a new 2-d (x, y) array
  // For example, height = 3, width = 3
  // [0,0] = 0, [0,1] = 3,.... , [1,0] = 9 (1 * 3 * width + 0 * 3), [1,1] = 12, [1,2] = 15 (1 * 3 * width) + 2 * 3
  // determine the center of the weights
  // for each point in the 2-d array, find the corresponding image data. 
  // if image data does not exist, extends the weight in each direction
  // map the 2-d array to the 1-d array
  // calculate the weighted red, green and blue values respectively, 
  // if pixel cannot 
  // append to the result array
  // return the result array
function processImage(imageData, height, width, weights){

  const NUM_COMPONENTS = 3;
  const getImageRGB = (y, x) => {
    const idx = NUM_COMPONENTS * (y * width + x);
    if (idx >= 0 && idx < imageData.length - 1) {
      return { r: imageData[idx], g: imageData[idx+1], b: imageData[idx+2] };
    } 
    return null;
  };

  const center = (weights.length - 1) / 2;
  const calculateWeightedRGB = (imageY, imageX) => {      
      return weights.reduce((sumWeight, row, rowIdx) => {
          let rowWeightedRGB = row.reduce((rowWeight, weight, colIdx) => {
                const distX = colIdx - center;
                const distY = rowIdx - center;
                
                // image data is not found. need to extend the edge so that matrix
                // covers neighbors of pixel
                const y = Math.min(Math.max(imageY + distY, 0), height - 1);
                const x = Math.min(Math.max(imageX + distX, 0), width - 1);                
                const imageRGB = getImageRGB(y, x);
                return [rowWeight[0] + weight * imageRGB.r,
                        rowWeight[1] + weight * imageRGB.g,
                        rowWeight[2] + weight * imageRGB.b];
            }, [0, 0, 0]);
            return [sumWeight[0] + rowWeightedRGB[0], 
                    sumWeight[1] + rowWeightedRGB[1], 
                    sumWeight[2] + rowWeightedRGB[2]];
      }, [0, 0, 0]);
  }

 let results = []; 
 for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
        let weightedRGB = calculateWeightedRGB(y, x);
        let r = Math.max(Math.min(Math.round(weightedRGB[0]), 255), 0);
        let g = Math.max(Math.min(Math.round(weightedRGB[1]), 255), 0);
        let b = Math.max(Math.min(Math.round(weightedRGB[2]), 255), 0);        
        results = results.concat([r,g,b]);
      }
  }
  return results;
}
