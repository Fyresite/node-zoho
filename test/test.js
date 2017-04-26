let assert = require('assert');

let _zoho = require('../index.js');

let debug = false;
// debug = true;

let Zoho = new _zoho(process.env.NODE_ZOHO_TEST_API_KEY, debug);

describe('Zoho API', () => {
  describe('#createUrl()', () => {
    it('should create a valid zoho api url', () => {
      let url = Zoho.createUrl({
        module:     'Accounts',
        actions:    'getRecordById',
        query:      'criteria=(First Name:John Smith)',
        object_id:  '1530131000006325005',
        attachment: 'data:fjdfj2kf4j2fjkfk2akfsdfjaf2'
      });

      assert.equal(
        `https://crm.zoho.com/crm/private/json/Accounts/getRecordById?wfTrigger=true&authtoken=${process.env.NODE_ZOHO_TEST_API_KEY}&scope=crmapi&criteria=(First Name:John Smith)&id=1530131000006325005&content=data:fjdfj2kf4j2fjkfk2akfsdfjaf2`,
        url
      );
    });
  });

  describe('#getRecordById', () => {
    it('should retrieve individual records by record ID.', (done) => {
      Zoho.getRecordById('Accounts', '2515239000000120044')
        .then(record => {
          if (Object.keys(record).length > 0) {
            done();
          } else {
            done(new Error('Record returned contained no keys.'));
          }
        }).catch(err => {
          done(err);
        });
    });
  });

  describe('#getRelatedRecords', () => {
    it('should retrieve records related to a primary module.', (done) => {
      Zoho.getRelatedRecords('Accounts', '2515239000000120044', 'Contacts')
        .then(records => {
          if (Object.keys(records).length > 0) {
            done();
          } else {
            done(new Error('Records returned contained no keys.'));
          }
        }).catch(err => {
          done(err);
        });
    });
  });

  describe('#searchRecords', () => {
    it('should retrieve the records that match search criteria.', (done) => {
      Zoho.searchRecords('Contacts', '((First Name:John)AND(Last Name:Smith))')
        .then(records => {
          if (Object.keys(records).length > 0) {
            done();
          } else {
            done(new Error('Records returned contained no keys.'));
          }
        }).catch(err => {
          done(err);
        });
    });
  });
});
