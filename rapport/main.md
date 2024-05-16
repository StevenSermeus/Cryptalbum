---
title: "Rapport"
author: ["Sermeus Steven", "Frippiat Gabriel"]
academicyear: 2023-2024
category: MASI
fontsize: 11pt
titlepage: true
code-block-font-size: \large
default-language: bash
minted:
  block_attributes:
    - linenos
    - style=rainbow_dash
    - frame=lines
    - framesep=2pt
    - bgcolor=solbg
    - breaklines=true
  default_block_language: c
  default_inline_language: c
header-includes:
  - \usepackage{fontawesome5}
  - \usepackage[outputdir=.minted_output]{minted}
  - \definecolor{solbg}{HTML}{efece2}
  - \setmintedinline{bgcolor={}}
  - \usepackage{tikz}
  - \usetikzlibrary{arrows,calc,shapes,automata,backgrounds,petri,fit,mindmap,decorations.pathmorphing,patterns,intersections,trees,positioning}
  - "\\makeatletter"
  - "\\let\\listoflistings\\@undefined"
  - "\\makeatother"
babel-lang: french
---

!include chapters/introduction.md

# Architecture

!include chapters/architecture-physique.md

!include chapters/architecture-logiciel.md

!include chapters/cryptographie.md

# Fonctionnalités de l'application

!include chapters/users.md

!include chapters/upload-fichier.md

!include chapters/partage-fichier.md

!include chapters/conclusion.md

!include chapters/bib.md
