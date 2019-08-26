exports.up = function(knex) {
    return knex.schema.createTable('graph', tbl => {
        // tbl.increments();
        // consider adding a table for users with other api keys
        tbl.integer('room_id')
            .primary()
            .unsigned()
            .notNullable()
            .unique();

        tbl.jsonb('room_data',5000)
            .notNullable();

        tbl.timestamp('created_at').defaultTo(knex.fn.now());
    }).createTable("directions",tbl => {

        tbl.unique(['from_room_FK','direction'])
        
        tbl.integer('from_room_FK')
            .notNullable()
            .references('room_id')
            .inTable('graph')
            .onDelete('RESTRICT')
            .onUpdate('CASCADE');

        tbl.string('direction')
            .notNullable()

        tbl.integer('to_room_FK')
            .references('room_id')
            .inTable('graph')
            .onDelete('RESTRICT')
            .onUpdate('CASCADE');
            
    })
    // .createTable('vertices',tbl => {
    //     tbl.primary('from','to',direction_FK)
        
    //     tbl.integer('from')
    //         .notNullable()
    //         .references('room_id')
    //         .inTable('graph')
    //         .onDelete('RESTRICT')
    //         .onUpdate('CASCADE');

    //     tbl.integer('to')
    //         .notNullable()
    //         .references('room_id')
    //         .inTable('graph')
    //         .onDelete('RESTRICT')
    //         .onUpdate('CASCADE');

    //     tbl.integer('direction_FK')
    //         .notNullable()
    //         .references('id')
    //         .inTable('directions')
    //         .onDelete('RESTRICT')
    //         .onUpdate('CASCADE');
    // })
};

exports.down = function(knex) {
    return knex.schema
          .dropTableIfExists('vertices')
          .dropTableIfExists('directions')
          .dropTableIfExists('graph')
};
