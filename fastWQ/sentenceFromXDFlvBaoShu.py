#-*- coding:utf-8 -*-
import random
from ..base import *
import re
from urllib.parse import unquote



# import the main window object (mw) from aqt
from aqt import mw
# import the "show info" tool from utils.py
from aqt.utils import showInfo
# import all of the Qt GUI library
from aqt.qt import *


@register(u'绿宝书中提取例句')
class sentencesFromXDFLvBaoShu(WebService):

    def __init__(self):
        super(sentencesFromXDFLvBaoShu, self).__init__()

    def _get_from_api(self):
        url_string  = self.quote_word
        string = unquote(url_string, 'utf-8')

        result = {
            'sentence': u'',
        }
        
        #匹配 例字之后的句子
        pattern = "(?<=\u4f8b)[\s\S]*\."  
        result['sentence'] = re.search( r'(?<=\u4f8b)[^\u4e00-\u9fa5]+', string, re.M|re.I).group(0)




        return self.cache_this(result)

    @export([u'绿宝书中提取例句', u'sentences From XDF Lv Bao Shu'])
    def fld_definate(self):
        return self._get_field('sentence')
