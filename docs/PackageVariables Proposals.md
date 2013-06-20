PackageVariables proposal database scheme
-----------------------------------------

## Initial variables
For housekeeper, hourly and babysitter pricing, we have next variables:

    - CleaningRate:decimal      provider rate cleaning 2beds and 2baths, for all cleaning pricing types
    - BedsNumber:int            customer value specifing the number of beds to clean, for all cleaning pricing types
    - BathsNumber:int           customer value specifing the number of bats to clean, for all cleaning pricing types
    - HoursNumber:decimal       customer value specifing the number of hours for the service, for hourly and babysitter pricing. Can be in minutes instead of in hours.
    - ChildsNumber:int          customer value specifing the number of childs, for babysitter pricing only.
    - ChildSurcharge:decimal    provider value specifing the extra price per extra child, for babysitter pricing only


##Proposal A

One table to hold values with table fields/columns per variable.
We doesn't need a table to define variables because they are already defined as columns with name and data-type. All are optional (can be null) and be used only for pricings
requiring it, with possibility to be reused between different pricings

###Scheme [PackageVariables]
    - UserID:int                provider or customer UserID
    - PackageID:int             package with that value
    - BookingId:int             will be 0 for provider values, and the BookingID for the customer values during booking. Maybe it can be the PricingEstimateID instead of BookingID
    - CleaningRate:decimal      can be null
    - BedsNumber:int            can be null
    - BathsNumber:int           can be null
    - HoursNumber:decimal       (or maybe minutes) can be null
    - ChildsNumber:int          can be null
    - ChildSurcharge:decimal    can be null

###System data
There is no need to define records with variables because they are self-defined in the table columns.

Note that is not good to have a large list of columns in a table, but this way they can be quicker and easier reused and accessed.


##Proposal B

Two tables: one to define what variables there are, and other one with values from provider and customer.

Its more similar to previous approach for variables, but re-thinking the fields we really need and using only one table for both provider and customer values.

###Scheme [PackageVariablesDefinition]
    - VariableID:int            identifier for the variable
    - InternalName:varchar      name of the variable. I prefer name it as 'InternalName' to be clear that
                                is Not a name to be translated or to show to the user and needs be hardcoded to do
                                specific things in code specific for to the variable meaning.
    - PricingTypeID:int         referencing for what pricing type will use this variable.
                                Variables shared by different pricing types need a duplicated record with the
                                different PricingTypeID (for example the three cleaning pricing types needs CleaningRate,
                                BedsNumber and BathsNumber, the HoursNumber for hourly and babysitter)
    - CP:char                   is a Customer variable or a Provider variable?
                                Possible values: 'C' or 'P' (maybe 'B' for 'both').
                                Maybe is not required because variable names are hardcoded and used only what the specific code need.
    - DataType:nvarchar         it sets what kind of data we are saving as value for this variable: decimal, integer, text, bool.
                                If will be only numeric values, we can remove this and use 'decimal' as data type ever.

###Scheme [PackageVariablesValues]
    - VariableID:int            references the variable
    - UserID:int                provider or customer identifier
    - PackageID:int             provider package that uses this value
    - BookingID:int             will be 0 for provider values, and the BookingID for the customer values during booking.
                                Maybe it can be the PricingEstimateID instead of BookingID
    - Value:nvarchar            the variable value saved as text to allow hold any kind of data type.
                                It requires conversions of the text to the defined variable DataType on any code using variables,
                                to allow do calculation and formatting.
                                It can be changed to 'decimal' if we consider we will hold only numeric values.

###System data [PackageVariablesDefinition]
<table>
 <tr>
  <th>VariableID</th><th>      InternalName</th><th>        PricingTypeID</th><th>       CP</th><th>      DataType</th>
 </tr>
 <tr>
  <td>1</td><td>               'CleaningRate'</td><td>      9</td><td>                   'P'</td><td>     'decimal'</td>
 </tr>
 <tr>
  <td>1</td><td>               'CleaningRate'</td><td>      10</td><td>                  'P'</td><td>     'decimal'</td>
 </tr>
 <tr>
  <td>1</td><td>               'CleaningRate'</td><td>      11</td><td>                  'P'</td><td>     'decimal'</td>
 </tr>
 <tr>
  <td>2</td><td>               'BedsNumber'</td><td>        9</td><td>                   'C'</td><td>     'int'</td>
 </tr>
 <tr>
  <td>2</td><td>               'BedsNumber'</td><td>        10</td><td>                  'C'</td><td>     'int'</td>
 </tr>
 <tr>
  <td>2</td><td>               'BedsNumber'</td><td>        11</td><td>                  'C'</td><td>     'int'</td>
 </tr>
 <tr>
  <td>3</td><td>               'BathsNumber'</td><td>       9</td><td>                   'C'</td><td>     'int'</td>
 </tr>
 <tr>
  <td>3</td><td>               'BathsNumber'</td><td>       10</td><td>                  'C'</td><td>     'int'</td>
 </tr>
 <tr>
  <td>3</td><td>               'BathsNumber'</td><td>       11</td><td>                  'C'</td><td>     'int'</td>
 </tr>
 <tr>
  <td>4</td><td>               'HoursNumber'</td><td>       1</td><td>                   'C'</td><td>     'decimal'</td>
 </tr>
 <tr>
  <td>4</td><td>               'HoursNumber'</td><td>       16? (babysitter)</td><td>    'C'</td><td>     'decimal'</td>
 </tr>
 <tr>
  <td>5</td><td>               'ChildsNumber'</td><td>      16? (babysitter)</td><td>    'C'</td><td>     'integer'</td>
 </tr>
 <tr>
  <td>6</td><td>               'ChildSurcharge'</td><td>    16? (babysitter)</td><td>    'P'</td><td>     'decimal'</td>
 </tr>
</table>

Note that this proposal requires more things to do the same, repeated variable records per pricing, extra code to do conversions, find variables and data is not saved 'as is'.
**Its good to have a large list of variables**, but still think that any new variable on both cases require new code for the pricing and variable (variables are not showed automatically
in a list as previoulsy was done with the 'custom' pricing type, because we require now more complex calculations that affect multiple variables and not 'one per line' and specific
UI to be smart and easier for our users.

##Proposal B++


###Scheme [PackageVariablesDefinition]
    - PricingVariableID:int         identifier for the variable
    - PositionID:int                maps variable to position;  "-1" for all positions
    - InternalName:varchar          name of the variable. I prefer name it as 'InternalName' to be clear that
                                    is Not a name to be translated or to show to the user and needs be hardcoded to do
                                    specific things in code specific for to the variable meaning.
    - PricingTypeID:int             referencing for what pricing type will use this variable.
                                    Variables shared by different pricing types need a duplicated record with the
                                    different PricingTypeID (for example the three cleaning pricing types needs CleaningRate,
                                    BedsNumber and BathsNumber, the HoursNumber for hourly and babysitter)
    - CP:char                       is a Customer variable or a Provider variable?
                                    Possible values: 'C' or 'P' (maybe 'B' for 'both').
    - DataType:nvarchar             it sets what kind of data we are saving as value for this variable: decimal, integer, text, bool.
                                    If will be only numeric values, we can remove this and use 'decimal' as data type ever.
    - ProviderLabel: varchar        Label given to the provider when entering it in the form in the dashboard
    - ProviderLabelPopUp: varchar   Text that will be in pop-up for ProviderLabel
    - VariableNameSingular: varchar Singular name of variable to be used in front-end content to customer and provider
    - VariableNamePlural: varchar   Plural name of variable to be used in front-end content to customer and provider
    - NumberIncludedLabel: varchar  Label given to the provider when entering it in the form in the dashbaord (can be null)
    - NumberIncludedLabelPopup:     Text that will be in pop-up for NumberIncludedLabel

###Scheme [ProviderPackageVariables]
    - ProviderPackageID:int         identifier for the package (maps to provider)
    - PricingVariableID:int         identifier for the variable
    - Value:nvarchar                the variable value saved as text to allow hold any kind of data type.
                                    It requires conversions of the text to the defined variable DataType on any code using variables,
                                    to allow do calculation and formatting.
                                    It can be changed to 'decimal' if we consider we will hold only numeric values.
    - NumberIncluded:decimal        The number of the variable type that is included in the package. Will be null for hours and defaulted
                                    to 1 for all others (providers can change this)
    - MinNumberAllowed:decimal      Will be used for hourly variable only (and null for all others).  May be used in "Classes" pricing type in future for min students.
    - MaxNumberAllowed:decimal      Will be used for max number of hours and also max number of a variable (if a babysitter can only babysit 4 children for example).

###Scheme [PricingEstimateDetail]  -Fields used
    - PricingEstimateID:int         identifier for the pricing estimate
    - PricingVariableID:int         identifier for the variable
    - ProviderPackageID: int        identifier for the package
    - ProviderPricingDataInput:     from ProviderPackageVariables.Value  
    - CustomerPricingDataInput:     from Booking Step 1
    NEED TO FINISH


CustomerInputValues:  --null (we could limit the inputs if this is text or even the numbers allowed)
ProviderInputValues:  --null (we could limit the inputs if this is text or even the numbers allowed)



##Last notes

I will try to create an abstraction in the code with some utilities shared by pricing types that require variables that can help to allow change in a future the database scheme with minimum changes in the code (only changing the utilities but not each pricing specific code).

Pricing formulas will still be coded instead of defined in database, as they can vary syntax depending on pricing, it allow us more possibilities and it calculates using all variables and differently depending on provider calculation or customer calculation. Previous use of variables ('custom' pricing) only required calculations per each variable in a set of reduced possibilites.

Texts showed to the user will be defined in the ressource files of the code; initially in the code itself but thinking in move it to ressources files as the most texts on the website. Because of that I didn't add LanguageID and CountryID fields on tables.

Tables will have too the common fields: CreatedDate, UpdatedDate, ModifiedBy and Active on tables that require it.
