// Solves for the homography matrix H given 4 pairs of points
// srcPoints: [[x,y], ...] (Video Coordinates)
// dstPoints: [[x,y], ...] (Map Coordinates)
// Returns a 3x3 matrix as a 1D array of 9 elements

export function computeHomography(srcPoints: number[][], dstPoints: number[][]) {
  if (srcPoints.length !== 4 || dstPoints.length !== 4) {
      console.warn("Homography requires exactly 4 point pairs");
      return null;
  }

  const P: number[] = [];
  const A: number[] = [];

  for (let i = 0; i < 4; i++) {
      let x = srcPoints[i][0];
      let y = srcPoints[i][1];
      let u = dstPoints[i][0];
      let v = dstPoints[i][1];

      P.push(-x, -y, -1, 0, 0, 0, x * u, y * u, u);
      P.push(0, 0, 0, -x, -y, -1, x * v, y * v, v);
  }

  // Gaussian elimination to solve Ph = 0
  // This is a simplified solver for the specific case of 8 equations
  // We'll use a basic numerical approach or a hardcoded solver if possible,
  // but for robustness without external libs, let's use a small Gauss-Jordan impl.
  
  // Construct 8x9 matrix (P)
  const rows = 8;
  const cols = 9;
  const matrix = [];
  for(let i=0; i<rows; i++) {
      matrix.push(P.slice(i*cols, (i+1)*cols));
  }

  // Gauss-Jordan
  for(let i=0; i<rows; i++) {
      // Pivot
      let pivot = matrix[i][i];
      if (Math.abs(pivot) < 1e-8) {
           // Swap rows if pivot is 0
           for(let j=i+1; j<rows; j++) {
               if(Math.abs(matrix[j][i]) > 1e-8) {
                   [matrix[i], matrix[j]] = [matrix[j], matrix[i]];
                   pivot = matrix[i][i];
                   break;
               }
           }
      }
      
      // Normalize row
      for(let j=i; j<cols; j++) matrix[i][j] /= pivot;

      // Eliminate other rows
      for(let k=0; k<rows; k++) {
          if (k !== i) {
              const factor = matrix[k][i];
              for(let j=i; j<cols; j++) matrix[k][j] -= factor * matrix[i][j];
          }
      }
  }

  // The last column is the solution (h1..h8), with h9 = 1
  const H = [];
  for(let i=0; i<8; i++) H.push(matrix[i][8]);
  H.push(1);
  
  return H;
}

export function applyHomography(H: number[], x: number, y: number) {
  if (!H || H.length !== 9) return { x: 0, y: 0 };

  const u = H[0] * x + H[1] * y + H[2];
  const v = H[3] * x + H[4] * y + H[5];
  const w = H[6] * x + H[7] * y + H[8];

  return { x: u / w, y: v / w };
}
