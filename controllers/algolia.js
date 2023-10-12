const algoliasearch = require('algoliasearch').default;

class AlgoliaController {

    client = algoliasearch("IG94JL2KBG", "1b47bd7d10e812e5b36dcc3bb7905df3")
    index = this.client.initIndex("tag_id");


    async findByObjectId(objectId) {
        try {
            const possibleTags = await this.index.getObject(objectId)
            console.log(possibleTags)
            return possibleTags;
        } catch (e) {
            return false;
        }
    }

    async addNewObject(dataObject, autoObjectId = false) {
        try {
            const response = await this.index.saveObject(dataObject, {
                autoGenerateObjectIDIfNotExist: autoObjectId
            })
            return response;
        } catch (e) {
            console.log(e)
            return false;
        }
    }

    async search(condition, queryType = "query") {
        try {
            const searches = await this.index.search(queryType === "query" ? condition.name : condition.id);
            let totalHits = searches.hits;
            if (totalHits.length > 0) {
                if (condition.name) {
                    return totalHits.filter(e => e.name === condition.name)[0];
                } else {
                    return totalHits[0];
                }
            } else {
                return false;
            }
        } catch (e) {
            return false;
        }
    }

    async updateObject(id, updates) {
        try {
            const response = await this.index.partialUpdateObject({
                ...updates
            })
            console.log(response);
            return true;
        } catch (e) {
            console.log(e);
            return false;
        }
    }

    async findByStatus() {
        return await this.index.search("1", {
            hitsPerPage: 1000000
        });
    }

    async browseObjects() {
        return new Promise((resolve, reject) => {
            let hits = []
            this.index.browseObjects({
                batch: (objects) => {
                    hits = hits.concat(objects)
                }
            }).then(() => {
                resolve(hits);
            })
        })
    }



}


module.exports = AlgoliaController;