import fetch from '../fetch';

class Zoho {
  constructor(apiKey, debug = false) {
    if (typeof apiKey === 'undefined') {
      throw new Error('api key is undefined');
    } else {
      this.key = apiKey;
      this.debug = debug;
    }
  }

  createUrl(options) {
    let url = `https://crm.zoho.com/crm/private/json/${options.module}/${options.actions}?wfTrigger=true&authtoken=${this.key}&scope=crmapi`;

		// If options has an object_id or attachment attached to the object we want to add
	  if (options.query)       { url += "&" + options.query }
		if (options.object_id)   { url += "&id=" + options.object_id }
		if (options.attachment)  { url += "&content=" + options.attachment }

    if (this.debug) {
      console.log(url);
    }

		return url;
	}

  fetch(url) {
		return fetch(url)
			.then((response) => {
				if (response.status === 414) {
					return response.text();
				} else {
          return response.json();
        }
			}).then(data => {
        return data.response;
      }).catch(err => {
				return err;
			});
	}

  async getRecordById(module, id) {
    return new Promise((resolve, reject) => {
      if (typeof id !== 'string') {
        reject(new Error('id must be type string'));
      } else {
        let url = this.createUrl({
          module,
          actions: 'getRecordById',
          query: `id=${id}`
        });

        this.fetch(url)
          .then(response => {
            if (response.error) {
      	      reject(new Error(`${response.error.code}: ${response.error.message}`));
      	    }
            else if (response.nodata) {
              // Send empty array because the results will be returned in an array
              resolve([]);
            }
            else {
              let array = response.result[module].row.FL;
              let record = {};

              array.forEach(field => record[field.val] = field.content);

              resolve(record);
            }
          }).catch(err => {
            reject(err);
          });
      }
    });
  }

  async getRelatedRecords(parent, id, module) {
    return new Promise((resolve, reject) => {
      if (typeof id !== 'string') {
        reject(new Error('id must be type string'));
      } else {
        let url = this.createUrl({
          module,
          actions: 'getRelatedRecords',
          query: `id=${id}&parentModule=${parent}`
        });

        console.log(url);

        this.fetch(url)
          .then(response => {
            if (response.error) {
      	      reject(new Error(`${response.error.code}: ${response.error.message}`));
      	    }
            else if (response.nodata) {
              // Send empty array because the results will be returned in an array
              resolve([]);
            }
            else {
              let array = response.result[module].row.FL;
              let record = {};

              array.forEach(field => record[field.val] = field.content);

              resolve(record);
            }
          }).catch(err => {
            reject(err);
          });
      }
    });
  }

  async searchRecords(module, criteria) {
    return new Promise((resolve, reject) => {
      if (typeof criteria !== 'string') {
        reject(new Error('criteria must be type string'));
      } else {
        let url = this.createUrl({
          module,
          actions: 'searchRecords',
          query: `criteria=${criteria}`
        });

        this.fetch(url)
          .then(response => {
            if (response.error) {
              // console.log(response.error);
      	      reject(new Error(`${response.error.code}: ${response.error.message}`));
      	    }
            else if (response.nodata) {
              // Send empty array because the results will be returned in an array
              resolve([]);
            }
            else {
              let records = [];
              if (Array.isArray(response.result[module].row)) {
                response.result[module].row.forEach((row, index) => {
                  let array = row.FL;
                  let record = {};

                  array.forEach(field => record[field.val] = field.content);
                  records.push(record);
                });
              } else {
                let array = response.result[module].row.FL;
                let record = {};

                array.forEach(field => record[field.val] = field.content);
                records.push(record);
              }

              resolve(records);
            }
          }).catch(err => {
            reject(err);
          });
      }
    });
  }
}

export default Zoho;
