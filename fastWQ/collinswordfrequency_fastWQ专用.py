#-*- coding:utf-8 -*-
import random
from ..base import *


@register(u'柯林斯词频')
class Vocabulary(WebService):

    def __init__(self):
        super(Vocabulary, self).__init__()

    def _get_from_api(self):
        data = self.get_response(u'https://www.collinsdictionary.com/dictionary/english/{}'.format(self.quote_word))
        soup = parse_html(data)
        result = {
            'word_frequency': u'',
        }

        # word_frequency

        elements = soup.find( "span" , class_="word-frequency-img")
        element =  elements['data-band']
        if element:
            result['word_frequency'] = element



        return self.cache_this(result)

    @export([u'柯林斯词频', u'Collins Word frequency'])
    def fld_definate(self):
        return self._get_field('word_frequency')
