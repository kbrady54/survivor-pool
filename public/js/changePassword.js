$(function () {
	Foundation.Abide.defaults.patterns['password'] = /^(.){7,}$/;
	$('#changepass-button').on('click', function() {
		if ($("#password").val() == $("#verifypassword").val()) {
			$("#password-change").submit();
		} else {
			$("#password-change").foundation('validateForm');
		}
	});

	$('#password-change').on('valid submit', function (e) {
		e.preventDefault();

		var userID = getCookie('userid');
		var Auth = getCookie('Auth');
		
		var password = {
			"password": $('#password').val(),
			"oldPassword": $("#existingpass").val()
		}	

		$.ajax({
		type: "PUT",
		url: 'users/password/' + userID,
		headers: {
                    'Auth': Auth
                },
		contentType : 'application/json',
		data: JSON.stringify(password),
		async: false
		})
		.done(function(data, textStatus, request){
			var successMsg = "<div class='success callout' data-closable='slide-out-right'><p>You've changed your Password.</p><button class='close-button' aria-label='Dismiss alert' type='button' data-close><span aria-hidden='true'>&times;</span></button></div>"
			$("#successPass").append(successMsg);
			$("#existingpass").val('');
			$("#password").val('');
			$("#verifypassword").val('');
		})
		.fail(function(data, textStatus, request){
			var successMsg = "<div class='alert callout' data-closable='slide-out-right'><p>Uh Oh, something went wrong.</p><button class='close-button' aria-label='Dismiss alert' type='button' data-close><span aria-hidden='true'>&times;</span></button></div>"
			$("#successPass").append(successMsg);
		});
	})
});