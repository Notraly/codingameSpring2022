# Spring Challenge 2021 - Typescript

## Install
Run `> yarn` or `> npm install`

## Build

Just run `> yarn build` or `> yarn build:watch`

## Put code in codding game
### Methode 1 (Automatic):
1) Install chrome extention on https://chrome.google.com/webstore/detail/codingame-sync-ext/ldjnbdgcceengbjkalemckffhaajkehd
2) Build your code with `> yarn build:watch`
3) Launch codingame extention in https://www.codingame.com/ide/challenge/spring-challenge-2021
   Choice file: `/dist/bundele.js` and click on `Upload from local file coding game`

You can now edit your source file and codingame wile be automaticly update when you save a file

### Methode 2 (Manualy):
1) Build your code with `> yarn build`
2) Copy `/dist/bundele.js` content to coding game IDE

## Content:
For this chalange you only need to know the content of `src/game/`. Other file that is present in `/src` contain
some Util and some file required for build.

## Debug a game that be play in coding game:

You can relaunch a game that be played in codingame!

Steps:
0) load game in codingame ide
1) In src/main.ts uncoment `logInput()` that is present in run function and upload it to codding game
2) In coding game ide click on `REJOUER DANS LES MÊME CONDITIONS`
3) In coding game ide chanche console filter for display only error ouput
4) Copy all Console content (with "Sortie d'erreur :" and round)
5) Past it in /src/test.txt
6) Add breackpoint in your IDE and launch test in debug mode
