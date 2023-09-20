import WikiBook from './book';
import moment from 'moment';
import showdown from 'showdown';

export default class Display {
    constructor(public wikibook: WikiBook) { }

    public date(date: any) {
        let targetdate = moment(date);
        let diff = new Date().getTime() - new Date(targetdate).getTime();
        diff = diff / 1000 / 60 / 60;
        if (diff > 24) return targetdate.format("YYYY-MM-DD");
        if (diff > 1) return Math.floor(diff) + "시간전"
        diff = diff * 60;
        if (diff < 2) return "방금전";
        return Math.floor(diff) + "분전";
    }

    public markdown(text: string) {
        let converter = new showdown.Converter();
        return converter.makeHtml(text);
    }
}