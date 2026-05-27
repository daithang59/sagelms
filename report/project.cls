% SageLMS report class.
% Use with: \documentclass[12pt,a4paper,oneside]{project}
\NeedsTeXFormat{LaTeX2e}
\ProvidesClass{project}[2026/05/23 SageLMS report class]

\DeclareOption*{\PassOptionsToClass{\CurrentOption}{report}}
\ProcessOptions\relax
\LoadClass[12pt,a4paper,oneside]{report}

\RequirePackage{iftex}
\ifPDFTeX
  \RequirePackage[utf8]{inputenc}
  \RequirePackage[T5]{fontenc}
  \RequirePackage{lmodern}
\else
  \RequirePackage{fontspec}
  \defaultfontfeatures{Ligatures=TeX}
  \setmainfont{Times New Roman}
  \setsansfont{Arial}
  \setmonofont{Consolas}[Scale=MatchLowercase]
\fi

\RequirePackage[a4paper,top=2.5cm,bottom=2.5cm,left=3cm,right=2cm]{geometry}
\RequirePackage{graphicx}
\RequirePackage{array}
\RequirePackage{indentfirst}
\RequirePackage{setspace}
\RequirePackage{caption}
\RequirePackage{fancyhdr}
\RequirePackage{xcolor}
\RequirePackage{xurl}
\RequirePackage{hyperref}

\setstretch{1.5}
\setlength{\parskip}{0.5em}
\setlength{\parindent}{1.25cm}
\setlength{\headheight}{16pt}
\raggedbottom

\setcounter{secnumdepth}{2}
\setcounter{tocdepth}{2}
\renewcommand{\arraystretch}{1.2}

\captionsetup{
  justification=centering,
  font=small,
  labelfont=bf
}

\definecolor{linkblue}{RGB}{20,77,145}
\hypersetup{
  colorlinks=true,
  linkcolor=linkblue,
  citecolor=linkblue,
  urlcolor=linkblue
}

\newcommand{\sagelms@value}[1]{\@ifundefined{#1}{}{\csname#1\endcsname}}

\renewcommand{\contentsname}{Mục lục}
\renewcommand{\listfigurename}{Danh mục hình}
\renewcommand{\listtablename}{Danh mục bảng}
\renewcommand{\chaptername}{Chương}
\renewcommand{\figurename}{Hình}
\renewcommand{\tablename}{Bảng}
\renewcommand{\appendixname}{Phụ lục}

\renewcommand{\headrulewidth}{0.3pt}
\renewcommand{\footrulewidth}{0pt}
\renewcommand{\chaptermark}[1]{\markboth{\chaptername\ \thechapter.\ #1}{}}

\pagestyle{fancy}
\fancyhf{}
\fancyhead[L]{\nouppercase{\leftmark}}
\fancyfoot[C]{\thepage}

\fancypagestyle{plain}{
  \fancyhf{}
  \fancyfoot[C]{\thepage}
  \renewcommand{\headrulewidth}{0pt}
  \renewcommand{\footrulewidth}{0pt}
}

\newcommand{\sagelmscoverpage}{%
  \begin{titlepage}
    \centering
    {\Large \sagelms@value{reportUniversity}\par}
    {\large \sagelms@value{reportFaculty}\par}
    \vspace{2.5cm}

    {\bfseries\Large \sagelms@value{reportCourse}\par}
    \vspace{1cm}
    {\bfseries\LARGE \sagelms@value{reportTitle}\par}
    \vspace{2cm}

    \begin{tabular}{>{\raggedright\arraybackslash}p{5cm}>{\raggedright\arraybackslash}p{8cm}}
      Môn học & \sagelms@value{reportSubject} \\
      Nhóm thực hiện & Nhóm SageLMS DevSecOps \\
    \end{tabular}

    \vspace{1.5cm}
    \begin{tabular}{>{\raggedright\arraybackslash}p{5cm}>{\raggedright\arraybackslash}p{8cm}}
      \textbf{Thành viên} & \textbf{Vai trò chính} \\
      \sagelms@value{studentA} & \sagelms@value{roleA} \\
      \sagelms@value{studentB} & \sagelms@value{roleB} \\
      \sagelms@value{studentC} & \sagelms@value{roleC} \\
      \sagelms@value{studentD} & \sagelms@value{roleD} \\
    \end{tabular}

    \vfill
    {\sagelms@value{reportDate}\par}
  \end{titlepage}
}
