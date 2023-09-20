import WikiBook from './book';

export default class UIStat {
    constructor(public wikibook: WikiBook) { }

    public async init() {
        await this.wikibook.service.navbar.set('wiki');
    }

    public async revert() {
        await this.wikibook.service.navbar.set('default');
        this.cache = {};
        this.member = null;
        this.plan = null;
    }

    public contentLink(content_id: string) {
        return `/wiki/${this.wikibook.data().namespace}/${content_id}`;
    }
}