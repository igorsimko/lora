#!/bin/bash

text="$1"
echo $text > text.log
espeak -ven+f3 -s01 "$text" 2>/dev/null
