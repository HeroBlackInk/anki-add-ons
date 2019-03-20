#-*- coding:utf-8 -*-
import random
from ..base import *


# import the main window object (mw) from aqt
from aqt import mw
# import the "show info" tool from utils.py
from aqt.utils import showInfo
# import all of the Qt GUI library
from aqt.qt import *


@register(u'柯林斯词频')
class Vocabulary(WebService):

    def __init__(self):
        super(Vocabulary, self).__init__()

    def _get_from_api(self):
        word  = self.quote_word
        #showInfo("current word %s" % word)
        word1 = word.replace('%20','-')
        #showInfo("current word %s" % word1)
        data = self.get_response(u'https://www.collinsdictionary.com/dictionary/english/{}'.format(word1))
        soup = parse_html(data)
        result = {
            'word_frequency': u'',
        }

        # word_frequency
        try:
            elements = soup.find( "span" , class_="word-frequency-img")
            element =  elements['data-band']
        except:
            return self.cache_this(result)
        if element:
            result['word_frequency'] = element



        return self.cache_this(result)

    @export([u'柯林斯词频', u'Collins Word frequency'])
    def fld_definate(self):
        return self._get_field('word_frequency')
