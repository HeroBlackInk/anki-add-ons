/* global api */
class encn_Cambridge_Test {
    constructor(options) {
        this.options = options;
        this.maxexample = 2;
        this.word = '';
    }

    async displayName() {
        let locale = await api.locale();
        if (locale.indexOf('CN') != -1)
            return '(在线)剑桥英汉双解Test数字分级_bug修复版0.1';
        if (locale.indexOf('TW') != -1)
            return '(在線)劍橋英漢雙解Test数字分级_bug修复版0.1';
        return '(online)encn_Cambridge';
    }

    setOptions(options){
        this.options = options;
        this.maxexample = options.maxexample;
    }

    async findTerm(word) {
        this.word = word;
        let promises = [this.findCambridge(word),this.findYoudao(word)];
        let results = await Promise.all(promises);
        return [].concat(...results).filter(x => x);
    }

    async findCambridge(word) {
        let notes = [];
        if (!word) return notes; // return empty notes

        function T(node) {
            if (!node)
                return '';
            else
                return node.innerText.trim();
        }

        let base = 'https://dictionary.cambridge.org/search/english-chinese-simplified/direct/?q=';
        let url = base + encodeURIComponent(word);
        let doc = '';
        try {
            let data = await api.fetch(url);
            let parser = new DOMParser();
            doc = parser.parseFromString(data, 'text/html');
        } catch (err) {
            return [];
        }

        let entries = doc.querySelectorAll('.cdo-dblclick-area .entry-body__el') || [];

        //collinsband
        let base1 = 'https://www.collinsdictionary.com/dictionary/english/';
        let word1 = word.replace(/\s+/g,"-");    //柯林斯自动剔除了链接中的空格，要换成符号"-"
        let url1 = base1 + encodeURIComponent(word1);
        let doc1 = '';
        try {
            let data1 = await api.fetch(url1);
            let parser1 = new DOMParser();
            doc1 = parser1.parseFromString(data1, 'text/html');
        } catch (err) {
            return [];
        }
        //let dictionary = doc1.querySelector('.dictionary.Cob_Adv_Brit');
        let band = doc1.querySelector('.word-frequency-img');
        let bandnum = band ? band.dataset.band : '';
        let extrainfo = bandnum ? `${Number(bandnum)}` : '';
        //collinsband end

        for (const entry of entries) {
            let definitions = [];
            let audios = [];

            let expression = T(entry.querySelector('.headword'));
            let reading = '';
            /*
            let readings = entry.querySelectorAll('.pron-info .ipa');
            if (readings) {
                let reading_uk = T(readings[0]);
                let reading_us = T(readings[1]);
                reading = (reading_uk || reading_us) ? `UK[${reading_uk}] US[${reading_us}] ` : '';
            }
            */
            let reading_uk = T(entry.querySelector('.uk .pron .ipa '));
            let reading_us = T(entry.querySelector('.us .pron .ipa '));
            reading = (reading_uk || reading_us) ? `UK[${reading_uk}] US[${reading_us}] ` : '';

            let pos = T(entry.querySelector('.posgram'));
            let irreg_infls_pos_header = T(entry.querySelector('.pos-header .irreg-infls'));
            pos = pos ? `<span class='pos'>${pos}</span><span class='irreg_infls'><b>${irreg_infls_pos_header}</b></span>` : '';
            audios[0] = `http://dict.youdao.com/dictvoice?audio=${encodeURIComponent(expression)}&type=1`;
            audios[1] = `http://dict.youdao.com/dictvoice?audio=${encodeURIComponent(expression)}&type=2`;

            let sensbodys = entry.querySelectorAll('.sense-body') || [];
            for (const sensbody of sensbodys) {
                let sensblocks = sensbody.childNodes || [];
                for (const sensblock of sensblocks) {
                    let phrasehead = '';
                    let defblocks = [];
                    if (sensblock.classList && sensblock.classList.contains('phrase-block')) {
                        phrasehead = T(sensblock.querySelector('.phrase-title'));
                        let phraseinfo = T(sensblock.querySelector('.phrase-info'));
                        phrasehead = phrasehead ? `<div class="phrasehead">${phrasehead}</div><div class="phraseinfo">${phraseinfo}</div>` : '';
                        defblocks = sensblock.querySelectorAll('.def-block') || [];
                    }
                    if (sensblock.classList && sensblock.classList.contains('def-block')) {
                        defblocks = [sensblock];
                    }
                    if (defblocks.length <= 0) continue;

                    // make definition segement
                    for (const defblock of defblocks) {
                        let eng_tran = T(defblock.querySelector('.def-head .def'));

                        let irreg_infls_pos_body = T(defblock.querySelector('.def-head .def-info .irreg-infls')); //pos-body中的动词不规则变化
                        //let irreg_infls = irreg_infls_pos_header ? `<span class='irreg_infls'><b>${irreg_infls_pos_header}</b></span>` : `<span class='irreg_infls'><b>${irreg_infls_pos_body}</b></span>`;

                        let lab = T(defblock.querySelector('.def-head .def-info>.lab'));
                        let epp_xref = T(defblock.querySelector('.def-head .def-info .epp-xref'));  //牛津分级
                        let gram = T(defblock.querySelector('.def-head .def-info .gram'));   //名词可数 or 不可数
                        let variant = T(defblock.querySelector('.def-head .def-info .var'));   //变形


                        let chn_tran = T(defblock.querySelector('.def-body .trans'));
                        if (!eng_tran) continue;
                        let definition = '';

                        irreg_infls_pos_body = `<span class='irreg_infls'><b>${irreg_infls_pos_body}</b></span>`;
                        lab = `<span class='lab'>${lab}</span>`;
                        epp_xref = `<span class='epp_xref'>${epp_xref}</span>`;
                        gram = `<span class='gram'>${gram}</span>`;
                        variant = `<span class='variant'>${variant}</span>`;
                        eng_tran = `<span class='eng_tran'>${irreg_infls_pos_body}${epp_xref} ${lab}${gram} ${variant} ${eng_tran.replace(RegExp(expression, 'gi'),`<b>${expression}</b>`)}</span>`;
                        chn_tran = `<span class='chn_tran'>${chn_tran}</span>`;

                        let tran = `<span class='tran'>${eng_tran}${chn_tran}</span>`;
                        definition += phrasehead ? `${phrasehead}${tran}` : `${pos}${tran}`;

                        // make exmaple segement
                        let examps = defblock.querySelectorAll('.def-body .examp') || [];
                        if (examps.length > 0 && this.maxexample > 0) {
                            definition += '<ul class="sents">';
                            for (const [index, examp] of examps.entries()) {
                                if (index > this.maxexample - 1) break; // to control only 2 example sentence.
                                let eng_examp = T(examp.querySelector('.eg'));
                                let chn_examp = T(examp.querySelector('.trans'));
                                definition += `<li class='sent'><span class='eng_sent'>${eng_examp.replace(RegExp(expression, 'gi'),`<b>${expression}</b>`)}</span><span class='chn_sent'>${chn_examp}</span></li>`;
                            }
                            definition += '</ul>';
                        }
                        definition && definitions.push(definition);
                    }
                }
            }
            let css = this.renderCSS();
            notes.push({
                css,
                expression,
                reading,
                extrainfo,
                definitions,
                audios
            });
        }
        return notes;
    }

    async findYoudao(word) {
        if (!word) return [];

        let base = 'http://dict.youdao.com/w/';
        let url = base + encodeURIComponent(word);
        let doc = '';
        try {
            let data = await api.fetch(url);
            let parser = new DOMParser();
            doc = parser.parseFromString(data, 'text/html');
            return getYoudao(doc);
        } catch (err) {
            return [];
        }

        function getYoudao(doc) {
            let notes = [];

            function T(node) {
                if (!node)
                    return '';
                else
                    return node.innerText.trim();
            }
            //get Youdao EC data: check data availability
            let defNodes = doc.querySelectorAll('#phrsListTab .trans-container ul li');
            if (!defNodes || !defNodes.length) return notes;

            //get headword and phonetic
            let expression = T(doc.querySelector('#phrsListTab .wordbook-js .keyword')); //headword
            let reading = '';
            let readings = doc.querySelectorAll('#phrsListTab .wordbook-js .pronounce');
            if (readings) {
                let reading_uk = T(readings[0]);
                let reading_us = T(readings[1]);
                reading = (reading_uk || reading_us) ? `${reading_uk} ${reading_us}` : '';
            }

            let audios = [];
            audios[0] = `http://dict.youdao.com/dictvoice?audio=${encodeURIComponent(expression)}&type=1`;
            audios[1] = `http://dict.youdao.com/dictvoice?audio=${encodeURIComponent(expression)}&type=2`;

            let definition = '<ul class="ec">';
            for (const defNode of defNodes)
                definition += `<li class="ec"><span class="ec_chn">${T(defNode)}</span></li>`;
            definition += '</ul>';
            let css = `
                <style>
                    ul.ec, li.ec {list-style: square inside; margin:0; padding:0;}
                </style>`;
            notes.push({
                css,
                expression,
                reading,
                definitions: [definition],
                audios
            });
            return notes;
        }
    }

    renderCSS() {
        let css = `
            <style>
                div.phrasehead{margin: 2px 0;font-weight: bold;}
                span.star {color: #FFBB00;}
                span.pos  {text-transform:lowercase; font-size:0.9em; margin-right:5px; padding:2px 4px; color:white; background-color:#0d47a1; border-radius:3px;}
                span.tran {margin:0; padding:0;}
                span.eng_tran {margin-right:3px; padding:0;}
                span.chn_tran {color:#0d47a1;}
                ul.sents {font-size:0.8em; list-style:square inside; margin:3px 0;padding:5px;background:rgba(13,71,161,0.1); border-radius:5px;}
                li.sent  {margin:0; padding:0;}
                span.eng_sent {margin-right:5px;}
                span.chn_sent {color:#0d47a1;}
                span.epp_xref {     margin-right: 3px;
                                    padding: 2px 5px;
                                    color: #fff;
                                    font-weight: 700;
                                    font-size: .8em;
                                    min-width: 14px;
                                    text-align: center;
                                    background-color: #444;
                                    -webkit-border-radius: 8px;
                                    -moz-border-radius: 8px;
                                    border-radius: 8px;}
                span.variant{     display: inline;
                                  font-variant: small-caps;
                                  font-size: 1.1em;
                                  font-weight: normal;}
                span.lab{     display: inline;
                                  font-variant: small-caps;
                                  font-size: 1.1em;
                                  font-weight: normal;}



            </style>`;
        return css;
    }
}
