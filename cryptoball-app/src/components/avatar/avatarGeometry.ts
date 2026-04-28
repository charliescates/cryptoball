import type { FaceShape } from "./avatarTypes";

export type HeadMetrics = {
  headPath: string;
  headWidth: number;
  headHeight: number;
  hairScaleX: number;
  hairScaleY: number;
  hairTranslateX: number;
  hairTranslateY: number;
  eyeY: number;
  browY: number;
  mouthY: number;
  noseY: number;
  earLeftX: number;
  earRightX: number;
};

export function getHeadMetrics(faceShape: FaceShape): HeadMetrics {
  switch (faceShape) {
    case "round":
      return {
        headPath:
          "M100 46C81 46 66 58 64 78C62 100 69 123 84 133C90 137 95 139 100 139C105 139 110 137 116 133C131 123 138 100 136 78C134 58 119 46 100 46Z",
        headWidth: 72,
        headHeight: 93,
        hairScaleX: 1.02,
        hairScaleY: 0.98,
        hairTranslateX: 0,
        hairTranslateY: 1,
        eyeY: 93.5,
        browY: 81,
        mouthY: 120,
        noseY: 96,
        earLeftX: 61.5,
        earRightX: 138.5,
      };
    case "square":
      return {
        headPath:
          "M100 43C82 43 67 56 65 74V103C65 111 67 117 72 122C76 126 81 130 86 136H114C119 130 124 126 128 122C133 117 135 111 135 103V74C133 56 118 43 100 43Z",
        headWidth: 70,
        headHeight: 93,
        hairScaleX: 1.06,
        hairScaleY: 1.06,
        hairTranslateX: -6,
        hairTranslateY: 0,
        eyeY: 93,
        browY: 80,
        mouthY: 118,
        noseY: 95,
        earLeftX: 60.5,
        earRightX: 139.5,
      };
    case "slim":
      return {
        headPath:
          "M100 43C86 43 74 57 71 82L69 111C68 142 82 165 100 166C118 165 132 142 131 111L129 82C126 57 114 43 100 43Z",
        headWidth: 60,
        headHeight: 123,
        hairScaleX: 0.92,
        hairScaleY: 1.05,
        hairTranslateX: 8,
        hairTranslateY: -1,
        eyeY: 92,
        browY: 79,
        mouthY: 118,
        noseY: 94,
        earLeftX: 64.5,
        earRightX: 135.5,
      };
    case "diamond":
      return {
        headPath:
          "M100 46C88 46 78 57 72 71C68 82 67 96 70 108C74 124 84 136 100 137C116 136 126 124 130 108C133 96 132 82 128 71C122 57 112 46 100 46Z",
        headWidth: 58,
        headHeight: 91,
        hairScaleX: 0.98,
        hairScaleY: 1.02,
        hairTranslateX: 2,
        hairTranslateY: 0,
        eyeY: 92.8,
        browY: 80.5,
        mouthY: 119.2,
        noseY: 95,
        earLeftX: 61,
        earRightX: 139,
      };
    case "heart":
      return {
        headPath:
          "M100 45C84 45 71 56 67 72C64 84 68 98 76 109C82 117 88 123 94 128C96 130 98 131 100 131C102 131 104 130 106 128C112 123 118 117 124 109C132 98 136 84 133 72C129 56 116 45 100 45Z",
        headWidth: 66,
        headHeight: 86,
        hairScaleX: 1.0,
        hairScaleY: 1.03,
        hairTranslateX: 0,
        hairTranslateY: 0,
        eyeY: 92.8,
        browY: 80.5,
        mouthY: 118.8,
        noseY: 94.8,
        earLeftX: 60,
        earRightX: 140,
      };
    case "long":
      return {
        headPath:
          "M100 42C84 42 73 58 71 82L69 112C68 145 79 168 100 169C121 168 132 145 131 112L129 82C127 58 116 42 100 42Z",
        headWidth: 60,
        headHeight: 127,
        hairScaleX: 0.94,
        hairScaleY: 1.08,
        hairTranslateX: 6,
        hairTranslateY: -2,
        eyeY: 92.5,
        browY: 79.5,
        mouthY: 120,
        noseY: 94.5,
        earLeftX: 63.5,
        earRightX: 136.5,
      };
    case "oval":
    default:
      return {
        headPath:
          "M100 44C82 44 68 57 66 81L64.5 108C63 138 80 162 100 164C120 162 137 138 135.5 108L134 81C132 57 118 44 100 44Z",
        headWidth: 70,
        headHeight: 120,
        hairScaleX: 1,
        hairScaleY: 1,
        hairTranslateX: 0,
        hairTranslateY: 0,
        eyeY: 92.5,
        browY: 80,
        mouthY: 119,
        noseY: 94,
        earLeftX: 60.5,
        earRightX: 139.5,
      };
  }
}
