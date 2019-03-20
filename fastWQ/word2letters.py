#-*- coding:utf-8 -*-
import random
from ..base import *


# import the main window object (mw) from aqt
from aqt import mw
# import the "show info" tool from utils.py
from aqt.utils import showInfo
# import all of the Qt GUI library
from aqt.qt import *


@register(u'单词分解成字母')
class Word2letters(WebService):

    def __init__(self):
        super(Word2letters, self).__init__()

    def _get_from_api(self):
        word  = self.quote_word

        result = {
            'letters': u'',
        }

        if word.isalpha():
            result['letters'] = ' '.join(word)



        return self.cache_this(result)

    @export([u'单词分解成字母', u'word to letters'])
    def fld_definate(self):
        return self._get_field('letters')
