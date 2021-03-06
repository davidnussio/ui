import Ember from 'ember';

export default Ember.Route.extend({
  model: function(params/*, transition*/) {
    var store = this.get('store');

    var dependencies = {
      allHosts: store.findAll('host'), // Need inactive ones in case a link points to an inactive host
    };

    if ( params.containerId )
    {
      dependencies.existing = store.find('container', params.containerId, {include: ['ports','instanceLinks']});
    }

    return Ember.RSVP.hash(dependencies, 'Load container dependencies').then(function(results) {

      var data, healthCheckData;
      if ( results.existing )
      {
        data = results.existing.serializeForNew();
        data.ports = (data.ports||[]).map((port) => {
          delete port.id;
          return port;
        });

        if ( Ember.isArray(data.instanceLinks) )
        {
          data.instanceLinks = (data.instanceLinks||[]).map((link) => {
            delete link.id;
            return link;
          });
        }

        if ( !data.environment )
        {
          data.environment = {};
        }

        healthCheckData = data.healthCheck;
        delete data.healthCheck;
      }
      else
      {
        data = {
          type: 'container',
          requestedHostId: params.hostId,
          tty: true,
          stdinOpen: true,
        };
      }

      var instance = store.createRecord(data);
      if ( healthCheckData )
      {
        // The type isn't set on an existing one
        healthCheckData.type = 'instanceHealthCheck';
        instance.set('healthCheck', store.createRecord(healthCheckData));
      }

      return Ember.Object.create({
        instance: instance,
        allHosts: results.allHosts,
      });
    });
  },

  resetController: function (controller, isExiting/*, transition*/) {
    if (isExiting)
    {
      controller.set('hostId', null);
      controller.set('stackId', null);
      controller.set('containerId', null);
      controller.set('stackId', null);
      controller.set('serviceId', null);
      controller.set('upgrade', null);
      controller.set('mode', null);
    }
  }
});
