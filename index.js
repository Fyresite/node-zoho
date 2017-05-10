let fetch     = require('node-fetch');
let jsonxml   = require('jsontoxml');

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

  cleanUpXmlValue(val) {
    if (/[&,]/.test(val)) {
      // We need to apply the special CDATA tag to this val to make
      // the xml valid for zoho.
      //
      // We might need to add more to this.

      val = val.replace(/&/g, '%26');
      val = val.replace(/,/g, '%2C');

      val = `<![CDATA[${val}]]>`;
    }

    return val;
  }

  getRecordById(module, id) {
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


  /**
   * getRelatedRecords - Gets records that are related to another
   *
   * @param  {string} parent the module you want to get the related record of
   * @param  {string} id     the id of the parent record
   * @param  {string} module the type of the related module
   * @return {array}         an array of the related records
   */
   getRelatedRecords(parent, id, module) {
    return new Promise((resolve, reject) => {
      if (typeof id !== 'string') {
        reject(new Error('id must be type string'));
      } else {
        let url = this.createUrl({
          module,
          actions: 'getRelatedRecords',
          query: `id=${id}&parentModule=${parent}`
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
              // console.log(response.result[module]);
              // console.log('');

              // If response.result[module].row is an array, there are multiple
              // records returned, if not, it's just one record.
              // Either way, we have to make sure that both are handled correctly
              let results;

              if (Array.isArray(response.result[module].row)) {
                results = response.result[module].row;
              } else {
                results = [response.result[module].row];
              }

              let records = [];
              let record;

              results.forEach((row, index) => {
                record = {};

                row.FL.forEach((field, index) => {
                  record[field.val] = field.content;
                });

                records.push(record);
              });

              resolve(record);
            }
          }).catch(err => {
            reject(err);
          });
      }
    });
  }

  // TODO Finish insertRecords method
  insertRecords(module, records) {
    return new Promise((resolve, reject) => {

      let json = {
        [module]: []
      };

      if (!Array.isArray(records)) {
        records = [records];
      }

      records.forEach((record, index) => {

        let fieldList = [];

        for (let prop in record) {
          let val = this.cleanUpXmlValue(record[prop]);

          fieldList.push({
            name: 'FL',
            attrs: {
              val: prop
            },
            text: val
          });
        }

        json[module].push({
          name: 'row',
          attrs: {
            no: `${index + 1}`
          },
          children: fieldList
        });
      });

      let xml = jsonxml(json);

      let url = this.createUrl({
        module,
        actions: 'insertRecords',
        query: `xmlData=${xml}`
      });

      // console.log(url);

      this.fetch(url)
        .then(response => {
          if (response.error) {
            reject(new Error(`${response.error.code}: ${response.error.message}`));
          } else {
            resolve(true);
          }
        }).catch(err => {
          reject(err);
        });
    });
  }

  searchRecords(module, criteria) {
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

module.exports = Zoho;
