/*!
 * jQuery Data Binder Plugin
 *
 * Provides easy data binding of a JSON object to an HTML template using jQuery.
 *
 * http://keithmcknight.net/
 * Copyright (c) 2012 Keith McKnight
 * Version: 0.1
 *
 * Dual licensed under the MIT and GPL licenses.
 */
(function($){

$.dataBind = function ()
{
	var plugin = this;

	/**
	 * Sets the data on the selector based on the selector type.
	 */
	plugin.set = function ( selector, data )
	{
		var element = $( selector );

		// If we're dealing with multiple elements, loop through them individually
		if ( element.length > 1 )
			return element.each( function ( i, o ) { plugin.assignData( o, data ); } );

		// Form elements
		if ( element.is( ':input' ) )
			element.val( data ).change();
		// Images
		else if ( element.is( 'img' ) )
			element.attr( 'src', data );
		// Everything else
		else
			element.html( data );

		// Mark this as a bindfield for later use
		element.attr( 'data-bindfield', true );

		return element;
	};

	/**
	 * Sets the data on the selector based on the value data type.
	 */
	plugin.setData = function ( selector, data )
	{
		if ( $.isPlainObject( data ) )
			plugin.bind( selector, data );
		else if ( $.isArray( data ) )
			plugin.bindArray( selector, data );
		else
			plugin.set( selector, data );

		return selector;
	};

	plugin.setData2 = function ( selector, data )
	{
		if ( $.isPlainObject( data ) )
			plugin.bind2( selector, data );
		else if ( $.isArray( data ) )
			plugin.bindArray( selector, data );
		else
			plugin.set( selector, data );

		return selector;
	};

	/**
	 * Clones the selector as many times as needed to display the data array.
	 */
	plugin.bindArray = function ( selector, data )
	{
		var element = $( selector );

		// We only one want one prototype
		var prototype = element.filter( ':first, [data-proto][data-proto!=""]' ).last();
		element.not( prototype ).remove();

		// Loop through to create as many dupes as we need
		var results = $();
		$.each( data, function ( i, value ) {
			var field = prototype.clone().insertBefore( prototype );
			plugin.setData( field, value )
			results = results.add( field );
		} );

		// Clean up and return results
		prototype.remove();
		return results;
	};

	/**
	 * Binds data to the selector.
	 * Usage: $('#selector').dataBind(data) or $.dataBind('#selector', data);
	 */
	plugin.bind = function ( selector, data )
	{
		if ( $.isArray( data ) ) return plugin.bindArray( selector, data );
		var element = $( selector );
		$.each( data, function ( key, value ) {
			var field = element.lazyFind( '[data-bindname="' + key + '"]' );
			plugin.setData( field, value )
		} );
		return element;
	};

	/**
	 * Binds data to the selector.
	 * Usage: $('#selector').dataBind(data) or $.dataBind('#selector', data);
	 */
	plugin.bind2 = function ( selector, data, dataPath )
	{
		console.log( 'bind2()');
		//dataPath = $.isArray( dataPath ) ? dataPath.slice( 0 ) : [];
		var element = $( selector );
		// If this is a bind target, get the data for it
		if ( element.is( '[data-bindname][data-bindname!=""]' ) )
		{
			if ( $.isArray( dataPath ) )
			{
				dataPath = dataPath.slice( 0 );
				dataPath.push( element.attr( 'data-bindname' ) );
			}
			else
				dataPath = []; // This skips the first one!!
			console.log( dataPath );
			var value = plugin.dataLookup( data, dataPath );
			// If this contained a leaf in the data, set the data and we're done
			if ( value && !$.isArray( value ) && !$.isPlainObject( value ) )
			{
				console.log ( value );
				plugin.set( element, value );
				return element;
			}
		}
		element.children().each( function ( i, o ) {
			plugin.bind2( o, data, dataPath );
		} );
		return element;
	};

	plugin.dataLookup = function ( data, path )
	{
		if ( typeof path === 'string' ) path = path.replace( /\[([^\]]+)\]/g,'.$1').replace( /['"]/, '' ).split( '.' );
		var search = data;
		$.each( path, function ( i, p ) {
			return !!( search = search[p] );
		} );
		return search;
	};

	/**
	 * Extracts data from the selector.
	 * Usage: $('#selector').dataBind() or $.dataBind('#selector');
	 */
	plugin.extract = function ( selector )
	{
		var element = $( selector );
		// If this is bindfield or there are no HTML children, this is the data
		if ( element.attr( 'data-bindfield' ) || !element.children().length ) return element.html();
		// Otherwise, go through the children
		var data = {};
		element.lazyFind( '[data-bindname][data-bindname!=""]' ).each( function ( i, o ) {
			o = $( o );
			var name = o.attr( 'data-bindname' );
			// Property is new, gotta add it
			if ( name && !data.hasOwnProperty( name ) )
				data[name] = plugin.extract( o );
			// Otherwise, treat it as an array
			else if ( name )
			{
				if ( !$.isArray( data[name] ) ) data[name] = [data[name]];
				data[name].push( plugin.extract( o ) );
			}
		} );
		return data;
	};

	// This is where we decide how we're using dataBind
	var command, selector, data;
	switch ( arguments.length )
	{
		case 0:
			console.log( 'Try $.dataBind( selector, data )...');
			return;
		case 1:
			command = arguments[0];
			if ( $.isPlainObject( command ) )
			{
				selector = command.selector;
				data = command.data;
				command = command.command;
			}
			else
			{
				selector = command;
				data = {};
				command = 'extract';
			}
			break;
		case 2:
			selector = arguments[0];
			data = arguments[1];
			command = 'bind';
			if ( !$.isPlainObject( data ) )
			{
				command = data;
				data = {};
			}
			break;
		default:
			selector = arguments[0];
			data = arguments[1];
			break;
	}
	return plugin[command]( selector, data );
};

/**
 * Binds data to a selector or retrieves the data bound to the selector.
 *
 * $('#selector').dataBind(data) iterates through data and tries to bind the
 * values to the selector and returns the selector (for chaining)
 *
 * $('#selector').dataBind() scans the selector for bound values and returns
 * values in an object
 *
 * @param  data object containing data to bind
 * @return the data pulled from the selector
 */
$.fn.dataBind = function ( data )
{
	return arguments.length ? $.dataBind( this, data ) : $.dataBind( this );
};

$.fn.dataBind2 = function ( data )
{
	return arguments.length ? $.dataBind( { selector:this, data:data, command:'bind2' } ) : $.dataBind( this );
};

/**
 * Find sub-elements matching the selector.
 *
 * $(target).lazyFind('.selector') works like $(target).find('.selector')
 * except that it ignores matching elements that are sub-elements of another
 * matching element.
 *
 * @param  s selector to use for the search
 * @return the original selector
 */
$.fn.lazyFind = function ( s )
{
	var results = $();
	$( this ).children().each( function ( i, o ) {
		o = $( o );
		// Add it, or the first match among children
		results = results.add( o.is( s ) ? o : o.lazyFind( s ) );
	} );
	return results;
};

/**
 * Find sub-elements matching the selector.
 *
 * This functions lazyFind, but worse, because it grabs all the elements
 * matching the selector, then filters out the ones that are descendants
 * of another matching element.
 */
$.fn.lazyFind2 = function ( s )
{
	var start = $( this );
	var results = start.find( s );
	results.each( function ( i, o ) {
		o = $( o );
		// If it has a parent that matches, ditch it
		if ( o.parent().closest( s, start ).length )
			results = results.not( o );
	} );
	return results;
};

/**
 * Find elements in the DOM matching the selector.
 *
 * $.lazyFind('.selector') works like $('.selector') except that it ignores
 * matching elements that are sub-elements of another matching element.
 *
 * @param  s selector to use for the search
 * @return the original selector
 */
$.lazyFind = function ( s )
{
	return $( document ).lazyFind( s );
};

$.dataLookup = function ( data, path )
{
	if ( typeof path === 'string' ) path = path.replace( /\[([^\]]+)\]/g,'.$1').replace( /['"]/, '' ).split( '.' );
	var search = data;
	$.each( path, function ( i, p ) {
		return !!( search = search[p] );
	} );
	return search;
};

/**
 * Measure execution time of a function in milliseconds
 *
 * You can optionally specify a number of times to run, and it will return an
 * array containing the average time, total time, and number of loops run
 *
 * @param  f function to call
 * @param  s number of times to run
 * @return execution time or average time, total time, and loop count
 */
$.time = function ( f, l )
{
	l = l || 1;
	var s = new Date().getTime();
	for ( var i = 0; i < l; i++ ) f.call();
	var e = new Date().getTime();
	var t = e - s;
	return l > 1 ? [t / l, t, l] : t;
};

})(jQuery);