#!/bin/bash

text="$1"
echo $text > text.log
espeak -v en+f4 -s 135 "$text" 2>/dev/null
