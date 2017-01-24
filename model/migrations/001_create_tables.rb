Sequel.migration do
  up do
    create_table :users do
      primary_key :id
      String :email, :null => false, :unique => true
      String :login, :null => false, :unique => true
      String :password, :null => false
      String :pepper, :null => false
      index :login
      index :email
    end

    create_table :forms do
      primary_key :id
      String :uid, :null => false, :unique => true
      String :title, :null => false
      foreign_key :user_id, :users
    end

    create_table :form_data do
      foreign_key :form_id, :forms, :null => false
      String :data, :text => true
      index :form_id
    end

    create_table :login_audit do
      foreign_key :user_id, :users, :null => false
      DateTime :timestamp, :null => false
      index :user_id
    end

    create_table :update_audit do
      foreign_key :form_id, :forms
      DateTime :timestamp, :null => false
      String :type, :size => 8
      integer :form_size
    end
  end

  down do
    drop_table :users
    drop_table :forms
    drop_table :form_data
    drop_table :login_audit
    drop_table :update_audit
  end
end

